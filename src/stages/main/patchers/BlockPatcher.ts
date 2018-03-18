import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { traverse } from 'decaffeinate-parser';
import NodePatcher from '../../../patchers/NodePatcher';
import SharedBlockPatcher from '../../../patchers/SharedBlockPatcher';
import { PatchOptions } from '../../../patchers/types';
import countVariableUsages from '../../../utils/countVariableUsages';
import notNull from '../../../utils/notNull';
import Scope from '../../../utils/Scope';
import FunctionPatcher from './FunctionPatcher';
import ReturnPatcher from './ReturnPatcher';

/**
 * Any child patcher that might be turned into an IIFE during patching. Each
 * such child must call markIIFEPatcherDescendant on this patcher in the
 * initialize step.
 */
export interface IIFEPatcher extends NodePatcher {
  willPatchAsIIFE(): boolean;
}

export default class BlockPatcher extends SharedBlockPatcher {
  statements: Array<NodePatcher>;

  _iifePatcherDescendants: Array<IIFEPatcher> = [];
  _explicitDeclarationsToAdd: Array<string> = [];

  markIIFEPatcherDescendant(iifePatcher: IIFEPatcher): void {
    this._iifePatcherDescendants.push(iifePatcher);
  }

  /**
   * In some cases, CoffeeScript constructs must be turned into IIFEs, but also
   * have assignments within them. The assignments should be seen as belonging
   * to the outer function scope, not the IIFE function scope, so we need to
   * explicitly hoist any variables that could be affected.
   */
  initialize(): void {
    for (let iifePatcher of this._iifePatcherDescendants) {
      if (!iifePatcher.willPatchAsIIFE()) {
        continue;
      }
      // Use the scope code to find all assignments, including loop assignees,
      // destructuring, etc.
      let fakeScope = new Scope(iifePatcher.node);
      traverse(iifePatcher.node, child => {
        fakeScope.processNode(child);
      });
      for (let name of fakeScope.getOwnNames()) {
        if (countVariableUsages(this.node, name) > countVariableUsages(iifePatcher.node, name) &&
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
    // Blocks can be surrounded by parens in CS but not JS, so just remove any parens if they're
    // there. The range of the block will always include the parens themselves.
    if (this.statements.length > 0) {
      this.removeInitialAndFinalParens();
    }

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

  private removeInitialAndFinalParens(): void {
    let firstChild = this.statements[0];
    for (
      let tokenIndex: SourceTokenListIndex | null = this.contentStartTokenIndex;
      tokenIndex !== null && tokenIndex.isBefore(firstChild.outerStartTokenIndex);
      tokenIndex = tokenIndex.next()
    ) {
      let token = this.sourceTokenAtIndex(tokenIndex);
      if (token && token.type === SourceType.LPAREN) {
        this.remove(token.start, token.end);
      }
    }
    let lastChild = this.statements[this.statements.length - 1];
    for (
      let tokenIndex: SourceTokenListIndex | null = this.contentEndTokenIndex;
      tokenIndex !== null && tokenIndex.isAfter(lastChild.outerEndTokenIndex);
      tokenIndex = tokenIndex.previous()
    ) {
      let token = this.sourceTokenAtIndex(tokenIndex);
      if (token && token.type === SourceType.RPAREN) {
        this.remove(token.start, token.end);
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

  allowPatchingOuterBounds(): boolean {
    return true;
  }
}
