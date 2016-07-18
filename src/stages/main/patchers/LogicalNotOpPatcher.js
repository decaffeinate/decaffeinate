import UnaryOpPatcher from './UnaryOpPatcher.js';

export default class LogicalNotOpPatcher extends UnaryOpPatcher {
  /**
   * Though it's possible that `!` could trigger a `valueOf` call to arbitrary
   * code, CoffeeScript ignores that possibility and so do we.
   */
  isRepeatable(): boolean {
    return this.expression.isRepeatable();
  }

  /**
   * ( `!` | `not` ) EXPRESSION
   */
  patchAsExpression(options={}) {
    if (this.expression.canHandleNegationInternally()) {
      this.expression.negate();
      this.remove(this.contentStart, this.expression.outerStart);
    } else {
      this.overwrite(this.contentStart, this.expression.outerStart, '!');
    }
    super.patchAsExpression(options);
  }
}
