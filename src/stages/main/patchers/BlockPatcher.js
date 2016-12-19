import FunctionPatcher from './FunctionPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import ReturnPatcher from './ReturnPatcher.js';
import type { SourceToken, PatcherContext } from './../../../patchers/types.js';
import { SourceType } from 'coffee-lex';

export default class BlockPatcher extends NodePatcher {
  statements: Array<NodePatcher>;
  shouldPatchInline: ?boolean;

  constructor(patcherContext: PatcherContext, statements: Array<NodePatcher>) {
    super(patcherContext);
    this.statements = statements;
    this.shouldPatchInline = null;
  }

  canPatchAsExpression(): boolean {
    return this.statements.every(
      statement => statement.prefersToPatchAsExpression()
    );
  }

  setExpression(force=false): boolean {
    let willPatchAsExpression = super.setExpression(force);
    if (willPatchAsExpression && this.prefersToPatchAsExpression()) {
      this.statements.forEach(statement => statement.setExpression());
    }
  }

  setImplicitlyReturns() {
    this.statements[this.statements.length - 1].setImplicitlyReturns();
  }

  /**
   * Force the patcher to treat the block as inline (semicolon-separated
   * statements) or not (newline-separated statements).
   */
  setShouldPatchInline(shouldPatchInline: boolean) {
    this.shouldPatchInline = shouldPatchInline;
  }

  patchAsStatement({ leftBrace=true, rightBrace=true }={}) {
    if (leftBrace) {
      this.insert(this.innerStart, '{');
    }

    this.statements.forEach(
      (statement, i, statements) => {
        if (i === statements.length - 1 && this.parent instanceof FunctionPatcher) {
          if (statement instanceof ReturnPatcher && !statement.expression) {
            let removeStart;
            if (statements.length > 1) {
              let startOfLineIndex = this.context.sourceTokens.lastIndexOfTokenMatchingPredicate(
                token => token.type === SourceType.NEWLINE || token.type === SourceType.SEMICOLON,
                statement.outerStartTokenIndex
              );
              removeStart = this.sourceTokenAtIndex(startOfLineIndex).start;
            } else {
              removeStart = statement.outerStart;
            }
            this.remove(
              removeStart,
              statement.outerEnd
            );
            return;
          }
        }
        if (statement.isSurroundedByParentheses()) {
          statement.setRequiresExpression();
        }
        let hasImplicitReturn = (
          statement.implicitlyReturns() &&
          !statement.explicitlyReturns()
        );
        let implicitReturnPatcher = hasImplicitReturn ?
          this.implicitReturnPatcher() : null;
        if (implicitReturnPatcher) {
          implicitReturnPatcher.patchImplicitReturnStart(statement);
        }
        statement.patch();
        if (implicitReturnPatcher) {
          implicitReturnPatcher.patchImplicitReturnEnd(statement);
        }
        if (statement.statementNeedsSemicolon()) {
          this.insert(statement.outerEnd, ';');
        }
      }
    );

    if (rightBrace) {
      if (this.inline()) {
        this.insert(this.innerEnd, ' }');
      } else {
        this.appendLineAfter('}', -1);
      }
    }
  }

  patchAsExpression({
    leftBrace=this.statements.length > 1,
    rightBrace=this.statements.length > 1
    }={}) {
    if (leftBrace) {
      this.insert(this.innerStart, '(');
    }
    this.statements.forEach(
      (statement, i, statements) => {
        statement.patch();
        if (i !== statements.length - 1) {
          let semicolonTokenIndex = this.getSemicolonSourceTokenBetween(
            statement,
            statements[i + 1]
          );
          if (semicolonTokenIndex) {
            let semicolonToken = this.sourceTokenAtIndex(semicolonTokenIndex);
            this.overwrite(semicolonToken.start, semicolonToken.end, ',');
          } else {
            this.insert(statement.outerEnd, ',');
          }
        }
      }
    );
    if (rightBrace) {
      this.insert(this.innerEnd, ')');
    }
  }

  /**
   * Insert statements somewhere in this block.
   */
  insertStatementsAtIndex(statements: Array<string>, index: number) {
    let separator = this.inline() ? '; ' : ';\n';
    if (index === this.statements.length) {
      let lastStatement = this.statements[this.statements.length - 1];
      let terminatorTokenIndex = this.context.sourceTokens.indexOfTokenMatchingPredicate(
        token => token.type === SourceType.NEWLINE || token.type === SourceType.SEMICOLON,
        lastStatement.outerEndTokenIndex
      );
      let insertionPoint = terminatorTokenIndex ?
        this.sourceTokenAtIndex(terminatorTokenIndex).start :
        lastStatement.outerEnd;
      let indent = lastStatement.getIndent();
      statements.forEach(line => this.insert(insertionPoint, `${separator}${indent}${line}`));
    } else {
      let statementToInsertBefore = this.statements[index];
      let insertionPoint = statementToInsertBefore.outerStart;
      let indent = statementToInsertBefore.getIndent();
      statements.forEach(line => this.insert(insertionPoint, `${line}${separator}${indent}`));
    }
  }

  /**
   * Insert a statement before the current block. Since blocks can be patched in
   * a number of ways, this needs to handle a few cases:
   * - If it's completely inline, we don't deal with any indentation and just
   *   put a semicolon-separated statement before the start.
   * - If it's a normal non-inline block, we insert the statement beforehand
   *   with the given indentation. However, `this.outerStart` is the first
   *   non-whitespace character of the first line, so it's already indented, so
   *   if we want to add a line with *less* indentation, it's a lot more tricky.
   *   We handle this by walking backward to the previous newline and inserting
   *   a new line from there. This allows the prepended line to have whatever
   *   indentation level we want.
   * - In some cases, such as nontrivial loop expressions with an inline body,
   *   the source CoffeeScript is inline, but we want the result to be
   *   non-inline, so we need to be a lot more careful. The normal non-inline
   *   strategy won't work because there's no newline to walk back to in the
   *   source CoffeeScript, so the strategy is to instead always insert at
   *   `this.outerStart`. That means that the indentation for the actual body
   *   needs to be done later, just before the body itself is patched. See the
   *   uses of shouldConvertInlineBodyToNonInline in LoopPatcher for an example.
   */
  insertLineBefore(statement: string, indent: string) {
    if (this.inline()) {
      this.insert(this.outerStart, `${statement}; `);
    } else if (this.node.inline) {
      if (indent === null) {
        indent = this.getIndent();
      }
      this.insert(this.outerStart, `${indent}${statement};\n`);
    } else {
      let insertIndex = this.outerStart;
      while (insertIndex > 0 && this.context.source[insertIndex] !== '\n') {
        insertIndex--;
      }
      this.insert(insertIndex, `\n${indent}${statement};`);
    }
  }

  insertLineAfter(statement: string, indent: string) {
    if (this.inline()) {
      this.insert(this.outerEnd, `; ${statement}`);
    } else {
      this.insert(this.outerEnd, `\n${indent}${statement};`);
    }
  }

  /**
   * @private
   */
  getSemicolonSourceTokenBetween(left: NodePatcher, right: NodePatcher): ?SourceToken {
    return this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === SourceType.SEMICOLON
    );
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    if (this.shouldPatchInline !== null) {
      return this.shouldPatchInline;
    }
    return this.node.inline;
  }

  /**
   * Blocks only exit via the last statement, so we check its code paths.
   */
  allCodePathsPresent(): boolean {
    return this.statements[this.statements.length - 1].allCodePathsPresent();
  }
}
