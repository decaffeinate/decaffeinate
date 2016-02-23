import NodePatcher from './NodePatcher';

/**
 * Handles embedded JavaScript.
 */
export default class JavaScriptPatcher extends NodePatcher {
  /**
   * All we have to do is strip off the backticks.
   */
  patchAsExpression() {
    // '`void 0`' → 'void 0`'
    //  ^
    this.remove(this.start, this.start + '`'.length);
    // 'void 0`' → 'void 0'
    //        ^
    this.remove(this.end - '`'.length, this.end);
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
