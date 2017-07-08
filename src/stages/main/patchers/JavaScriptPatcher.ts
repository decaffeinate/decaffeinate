import NodePatcher from './../../../patchers/NodePatcher';

/**
 * Handles embedded JavaScript.
 */
export default class JavaScriptPatcher extends NodePatcher {
  /**
   * All we have to do is strip off the backticks.
   */
  patchAsExpression(): void {
    // '`void 0`' → 'void 0`'
    //  ^
    this.remove(this.contentStart, this.contentStart + '`'.length);
    // 'void 0`' → 'void 0'
    //        ^
    this.remove(this.contentEnd - '`'.length, this.contentEnd);
  }
}
