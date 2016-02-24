import UnaryOpPatcher from './UnaryOpPatcher.js';

export default class LogicalNotOpPatcher extends UnaryOpPatcher {
  /**
   * '!' EXPRESSION
   */
  patchAsExpression() {
    // `not a` → `!a`
    //  ^^^^      ^
    this.overwrite(this.start, this.expression.before, '!');
    super.patchAsExpression();
  }
}
