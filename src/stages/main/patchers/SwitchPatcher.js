import NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext, SourceToken } from '../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class SwitchPatcher extends NodePatcher {
  expression: NodePatcher;
  cases: Array<NodePatcher>;
  alternate: ?NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher, cases: Array<NodePatcher>, alternate: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
    this.cases = cases;
    this.alternate = alternate;
  }

  initialize() {
    if (this.expression) {
      this.expression.setRequiresExpression();
    }
  }

  prefersToPatchAsExpression() {
    return false;
  }

  patchAsStatement() {
    if (this.expression) {
      // `switch a` → `switch (a`
      //                      ^
      if (!this.expression.isSurroundedByParentheses()) {
        this.insert(this.expression.contentStart, '(');
      }

      this.expression.patch();

      // `switch (a` → `switch (a)`
      //                         ^
      if (!this.expression.isSurroundedByParentheses()) {
        this.insert(this.expression.contentEnd, ')');
      }

      // `switch (a)` → `switch (a) {`
      //                            ^
      this.insert(this.expression.outerEnd, ' {');
    } else {
      this.cases.forEach(casePatcher => casePatcher.negate());

      // `switch` → `switch (false) {`
      //                   ^^^^^^^^^^
      let switchToken = this.getSwitchToken();
      this.insert(switchToken.end, ' (false) {');
    }

    this.cases.forEach(casePatcher => casePatcher.patch());

    this.overwriteElse();
    if (this.alternate) {
      this.alternate.patch({ leftBrace: false, rightBrace: false });
    } else if (this.getElseToken() === null && super.implicitlyReturns()) {
      let emptyImplicitReturnCode =
        this.implicitReturnPatcher().getEmptyImplicitReturnCode();
      if (emptyImplicitReturnCode) {
        this.insert(this.contentEnd, `\n`);
        this.insert(this.contentEnd, `${this.getIndent(1)}default:\n`);
        this.insert(this.contentEnd, `${this.getIndent(2)}${emptyImplicitReturnCode}`);
      }
    }

    this.appendLineAfter('}');
  }

  /**
   * If we're a statement, our children can handle implicit return, so no need
   * to convert to an expression.
   */
  implicitlyReturns() {
    return super.implicitlyReturns() && this.willPatchAsExpression();
  }

  setImplicitlyReturns() {
    super.setImplicitlyReturns();
    this.cases.forEach(casePatcher => casePatcher.setImplicitlyReturns());
    if (this.alternate) {
      this.alternate.setImplicitlyReturns();
    }
  }

  patchAsExpression() {
    this.setImplicitlyReturns();

    this.patchInIIFE(() => {
      this.insert(this.innerStart, ' ');
      this.patchAsStatement();
      this.insert(this.innerEnd, ' ');
    });
  }

  canHandleImplicitReturn(): boolean {
    return this.willPatchAsExpression();
  }

  /**
   * @private
   */
  overwriteElse() {
    // `else` → `default:`
    //           ^^^^^^^^
    let elseToken = this.getElseToken();
    if (elseToken) {
      this.overwrite(elseToken.start, elseToken.end, 'default:');
    }
  }

  /**
   * @private
   */
  getElseToken(): ?SourceToken {
    let searchStart;
    if (this.cases.length > 0) {
      searchStart = this.cases[this.cases.length - 1].outerEnd;
    } else {
      searchStart = this.expression.outerEnd;
    }

    let searchEnd;
    if (this.alternate) {
      searchEnd = this.alternate.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }

    let elseTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart, searchEnd, token => token.type === SourceType.ELSE
    );
    if (!elseTokenIndex || elseTokenIndex.isBefore(this.contentStartTokenIndex)) {
      if (this.alternate) {
        throw this.alternate.error(`no ELSE token found before 'switch' alternate`);
      } else {
        return null;
      }
    }
    return this.sourceTokenAtIndex(elseTokenIndex);
  }

  /**
   * @private
   */
  getSwitchToken(): SourceToken {
    let switchToken = this.sourceTokenAtIndex(this.contentStartTokenIndex);
    if (!switchToken) {
      throw this.error(`bad token index for start of 'switch'`);
    }
    if (switchToken.type !== SourceType.SWITCH) {
      throw this.error(`unexpected ${SourceType[switchToken.type]} token at start of 'switch'`);
    }
    return switchToken;
  }

  /**
   * Switch statements with all code paths present have a `default` case and
   * each case has all of its code paths covered.
   */
  allCodePathsPresent(): boolean {
    if (!this.alternate) {
      return false;
    }

    return (
      this.cases.every(switchCase => switchCase.allCodePathsPresent()) &&
      this.alternate.allCodePathsPresent()
    );
  }
}
