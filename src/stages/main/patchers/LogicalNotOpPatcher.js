import UnaryOpPatcher from './UnaryOpPatcher.js';

export default class LogicalNotOpPatcher extends UnaryOpPatcher {
  /**
   * '!' EXPRESSION
   */
  patchAsExpression() {
    // `not a` → `!a`
    //  ^^^^      ^
    this.overwrite(this.contentStart, this.expression.outerStart, '!');
    super.patchAsExpression();
  }
}
