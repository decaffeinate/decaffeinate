import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import SharedBlockPatcher from '../../../patchers/SharedBlockPatcher';
import { PatchOptions } from '../../../patchers/types';
import countVariableUsages from '../../../utils/countVariableUsages';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/SharedBlockPatcher';
import ForPatcher from './ForPatcher';
import FunctionPatcher from './FunctionPatcher';
import ReturnPatcher from './ReturnPatcher';

export default class BlockPatcher extends SharedBlockPatcher {
  statements: Array<NodePatcher>;

  _forPatcherDescendants: Array<ForPatcher> = [];
  _explicitDeclarationsToAdd: Array<string> = [];

  /**
   * Called by initialize within child ForPatchers, so this array will be
   * available in our initialize method.
   */
  markForPatcherDescendant(forPatcher: ForPatcher): void {
    this._forPatcherDescendants.push(forPatcher);
  }

  /**
   * In some cases, loops assign to variables, but will be turned into IIFEs,
   * moving the variable scope into the IIFE. This can cause incorrect behavior
   * if the variable is used outside the loop body, so we want to explicitly
   * declare the variable at the top of the block in that case.
   */
  initialize(): void {
    for (let forPatcher of this._forPatcherDescendants) {
      for (let name of forPatcher.getIIFEAssignments()) {
        if (countVariableUsages(this.node, name) > countVariableUsages(forPatcher.node, name) &&
            this._explicitDeclarationsToAdd.indexOf(name) === -1) {
          this._explicitDeclarationsToAdd.push(name);
        }
      }
    }
  }

  canPatchAsExpression(): boolean {
    return this._explicitDeclarationsToAdd.length === 0 &&
      this.statements.every(statement => statement.canPatchAsExpression());
  }

  prefersToPatchAsExpression(): boolean {
    return this.statements.length === 0 ||
      (this.statements.length === 1 &&  this.statements[0].prefersToPatchAsExpression());
  }

  setExpression(force: boolean = false): boolean {
    let willPatchAsExpression = super.setExpression(force);
    if (willPatchAsExpression && this.prefersToPatchAsExpression()) {
      this.statements.forEach(statement => statement.setExpression());
      return true;
    }
    return false;
  }

  setImplicitlyReturns(): void {
    // A block can have no statements if it only had a block comment.
    if (this.statements.length > 0) {
      this.statements[this.statements.length - 1].setImplicitlyReturns();
    }
  }

  /**
   * Force the patcher to treat the block as inline (semicolon-separated
   * statements) or not (newline-separated statements).
   */
  setShouldPatchInline(shouldPatchInline: boolean): void {
    this.shouldPatchInline = shouldPatchInline;
  }

  patchAsStatement({leftBrace=true, rightBrace=true}: PatchOptions = {}): void {
    if (leftBrace) {
      this.insert(this.innerStart, '{');
    }

    if (this._explicitDeclarationsToAdd.length > 0) {
      this.insertStatementsAtIndex([`var ${this._explicitDeclarationsToAdd.join(', ')};`], 0);
    }

    let constructor: NodePatcher | null = null;
    this.statements.forEach(
      (statement, i, statements) => {
        if (i === statements.length - 1 && this.parent instanceof FunctionPatcher) {
          if (statement instanceof ReturnPatcher && !statement.expression) {
            this.removeFinalEmptyReturn(statement);
            return;
          }
        }
        // If we see a constructor (which only happens when this is a class
        // block), defer it until the end. Its patching may need other class
        // keys to already be patched so that it can generate method binding
        // statements within the constructor.
        // Check against the 'Constructor' node type instead of doing
        // `instanceof` to avoid a circular import issue.
        if (statement.node.type === 'Constructor') {
          if (constructor) {
            throw this.error('Unexpectedly found two constructors in the same block.');
          }
          constructor = statement;
        } else {
          this.patchInnerStatement(statement);
        }
      }
    );
    if (constructor) {
      this.patchInnerStatement(constructor);
    }

    if (rightBrace) {
      if (this.inline()) {
        this.insert(this.innerEnd, ' }');
      } else {
        this.appendLineAfter('}', -1);
      }
    }
  }

  patchInnerStatement(statement: NodePatcher): void {
    let hasImplicitReturn = (
      statement.implicitlyReturns() &&
      !statement.explicitlyReturns()
    );

    if (statement.isSurroundedByParentheses() &&
        !statement.statementNeedsParens() &&
        !hasImplicitReturn) {
      this.remove(statement.outerStart, statement.innerStart);
      this.remove(statement.innerEnd, statement.outerEnd);
    }

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

  /**
   * Remove an unnecessary empty return at the end of a function. Ideally, we
   * want to remove the whole line, but that's only safe if the `return` is on a
   * line by itself. Otherwise, there might be bugs like code being pulled into
   * a comment on the previous line.
   */
  removeFinalEmptyReturn(statement: NodePatcher): void {
    let previousTokenIndex = statement.contentStartTokenIndex.previous();
    let nextTokenIndex = statement.contentEndTokenIndex.next();
    let previousToken = previousTokenIndex && this.sourceTokenAtIndex(previousTokenIndex);
    let nextToken = nextTokenIndex && this.sourceTokenAtIndex(nextTokenIndex);

    if (previousToken && previousToken.type === SourceType.NEWLINE &&
        (!nextToken || nextToken.type === SourceType.NEWLINE)) {
      this.remove(previousToken.start, statement.outerEnd);
    } else if (previousToken && previousToken.type === SourceType.SEMICOLON) {
      this.remove(previousToken.start, statement.outerEnd);
    } else {
      this.remove(statement.outerStart, statement.outerEnd);
    }
  }

  patchAsExpression({
    leftBrace=this.statements.length > 1,
    rightBrace=this.statements.length > 1
  }: PatchOptions = {}): void {
    if (leftBrace) {
      this.insert(this.innerStart, '(');
    }
    if (this.statements.length === 0) {
      this.insert(this.contentStart, 'undefined');
    } else {
      this.statements.forEach(
        (statement, i, statements) => {
          statement.setRequiresExpression();
          statement.patch();
          if (i !== statements.length - 1) {
            let semicolonTokenIndex = this.getSemicolonSourceTokenIndexBetween(
              statement,
              statements[i + 1]
            );
            if (semicolonTokenIndex) {
              let semicolonToken = notNull(this.sourceTokenAtIndex(semicolonTokenIndex));
              this.overwrite(semicolonToken.start, semicolonToken.end, ',');
            } else {
              this.insert(statement.outerEnd, ',');
            }
          }
        }
      );
    }
    let lastToken = this.lastToken();
    if (lastToken.type === SourceType.SEMICOLON) {
      this.remove(lastToken.start, lastToken.end);
    }
    if (rightBrace) {
      this.insert(this.innerEnd, ')');
    }
  }

  /**
   * @private
   */
  getSemicolonSourceTokenIndexBetween(left: NodePatcher, right: NodePatcher): SourceTokenListIndex | null {
    return this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === SourceType.SEMICOLON
    );
  }

  /**
   * Blocks only exit via the last statement, so we check its code paths.
   */
  allCodePathsPresent(): boolean {
    return this.statements[this.statements.length - 1].allCodePathsPresent();
  }
}
