import NodePatcher from './../../../patchers/NodePatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';

/**
 * Handles embedded JavaScript.
 */
export default class JavaScriptPatcher extends NodePatcher {
  /**
   * All we have to do is strip off the backticks.
   */
  patchAsExpression(): void {
    // For any normal surrounding parens, CoffeeScript's rule is to remove them,
    // which allows things like comment-only inline JS. Function call parens
    // should not be removed, though.
    let shouldRemoveSurroundingParens =
      !(this.parent instanceof FunctionApplicationPatcher && this === this.parent.args[0]);

    if (shouldRemoveSurroundingParens) {
      this.remove(this.outerStart, this.contentStart);
    }
    // '`void 0`' → 'void 0`'
    //  ^
    this.remove(this.contentStart, this.contentStart + '`'.length);
    // 'void 0`' → 'void 0'
    //        ^
    this.remove(this.contentEnd - '`'.length, this.contentEnd);
    if (shouldRemoveSurroundingParens) {
      this.remove(this.contentEnd, this.outerEnd);
    }
  }
}
