import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class ThrowPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  /**
   * Throw in JavaScript is a statement only, so we'd prefer it stay that way.
   */
  prefersToPatchAsExpression(): boolean {
    return false;
  }

  /**
   * Throw statements that are in the implicit return position should simply
   * be left alone as they're pure statements in JS and don't have a value.
   */
  setImplicitlyReturns() {
    // throw can't be an implicit return
  }

  /**
   * `throw` statements cannot normally be used as expressions, so we wrap them
   * in an arrow function IIFE.
   */
  patchAsExpression() {
    let hasParens = this.isSurroundedByParentheses();
    if (!hasParens) {
      // `throw err` → `(throw err`
      //                ^
      this.insert(this.outerStart, '(');
    }
    // `(throw err` → `(() => { throw err`
    //                  ^^^^^^^^
    this.insert(this.innerStart, '() => { ');
    this.patchAsStatement();
    // `(() => { throw err` → `(() => { throw err }`
    //                                           ^^
    this.insert(this.innerEnd, ' }');
    if (!hasParens) {
      // `(() => { throw err }` → `(() => { throw err })`
      //                                               ^
      this.insert(this.outerEnd, ')');
    }
    // `(() => { throw err })` → `(() => { throw err })()`
    //                                                 ^^
    this.insert(this.outerEnd, '()');
  }

  patchAsStatement() {
    let throwToken = this.sourceTokenAtIndex(this.contentStartTokenIndex);
    if (throwToken.type !== SourceType.THROW) {
      throw this.error('Expected to find throw token at the start of throw statement.');
    }
    let spacing = this.slice(throwToken.end, this.expression.outerStart);
    if (spacing.indexOf('\n') !== -1) {
      this.overwrite(throwToken.end, this.expression.outerStart, ' ');
    }
    this.expression.patch();
  }

  /**
   * This is here so that we can add the `()` outside any existing parens.
   */
  allowPatchingOuterBounds(): boolean {
    return true;
  }
}
