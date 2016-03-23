import NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, Node, ParseContext, Editor } from './../../../patchers/types.js';
import { NEWLINE, SEMICOLON } from 'coffee-lex';

export default class BlockPatcher extends NodePatcher {
  statements: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, statements: Array<NodePatcher>) {
    super(node, context, editor);
    this.statements = statements;
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

  patchAsStatement({ leftBrace=true, rightBrace=true }={}) {
    if (leftBrace) {
      this.insert(this.innerStart, '{');
    }

    this.statements.forEach(
      statement => {
        if (statement.isSurroundedByParentheses()) {
          statement.setRequiresExpression();
        }
        if (statement.implicitlyReturns() && !statement.explicitlyReturns()) {
          statement.setRequiresExpression();
          this.insert(statement.outerStart, 'return ');
        }
        statement.patch();
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
    let separator = this.inline() ? '; ' : '\n';
    if (index === this.statements.length) {
      let lastStatement = this.statements[this.statements.length - 1];
      let terminatorTokenIndex = this.context.sourceTokens.indexOfTokenMatchingPredicate(
        token => token.type === NEWLINE || token.type === SEMICOLON,
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
   * @private
   */
  getSemicolonSourceTokenBetween(left: NodePatcher, right: NodePatcher): ?SourceToken {
    return this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === SEMICOLON
    );
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    return this.node.inline;
  }

  /**
   * Blocks only exit via the last statement, so we check its code paths.
   */
  allCodePathsPresent(): boolean {
    return this.statements[this.statements.length - 1].allCodePathsPresent();
  }
}
