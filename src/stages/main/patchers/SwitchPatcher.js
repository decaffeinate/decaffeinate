import NodePatcher from '../../../patchers/NodePatcher.js';
import type { PatcherContext, SourceToken } from '../../../patchers/types.js';
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
    }

    this.appendLineAfter('}');
  }

  setImplicitlyReturns() {
    this.cases.forEach(casePatcher => casePatcher.setImplicitlyReturns());
    if (this.alternate) {
      this.alternate.setImplicitlyReturns();
    }
  }

  patchAsExpression() {
    this.setImplicitlyReturns();

    // `` → `(() => { `
    //       ^^^^^^^^^
    this.insert(this.contentStart, '(() => { ');
    this.patchAsStatement();

    // `` → ` })()`
    //       ^^^^^
    this.appendToEndOfLine(' })()');
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
    if (!this.alternate) {
      return null;
    }

    let tokens = this.context.sourceTokens;
    let elseTokenIndex = tokens.lastIndexOfTokenMatchingPredicate(
      token => token.type === SourceType.ELSE,
      this.alternate.contentStartTokenIndex
    );
    if (!elseTokenIndex || elseTokenIndex.isBefore(this.contentStartTokenIndex)) {
      throw this.alternate.error(`no ELSE token found before 'switch' alternate`);
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
