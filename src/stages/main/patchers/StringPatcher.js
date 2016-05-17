import PassthroughPatcher from './../../../patchers/PassthroughPatcher.js';
import joinMultilineString from '../../../utils/joinMultilineString.js';

export default class StringPatcher extends PassthroughPatcher {
  patchAsExpression() {
    joinMultilineString(this, this.node.raw, this.contentStart);
  }

  patch(options={}) {
    super.patch(options);
    // Yuck, this is copied from NodePatcher.js super.super.patch(options)??
    // To ensure all tests pass we need functionality from both in this class.
    this.withPrettyErrors(() => {
      if (this.forcedToPatchAsExpression()) {
        this.patchAsForcedExpression(options);
      } else if (this.willPatchAsExpression()) {
        this.patchAsExpression(options);
      } else {
        this.patchAsStatement(options);
      }
    });
  }
}
