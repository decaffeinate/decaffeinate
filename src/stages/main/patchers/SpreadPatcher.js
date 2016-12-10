import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

/**
 * Handles spread operations, e.g. `a(b...)` or `[a...]`.
 */
export default class SpreadPatcher extends NodePatcher {
  expression: ?NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  /**
   * All we have to do is move the `...` from the right to the left.
   */
  patchAsExpression() {
    if (this.node.virtual) {
      // i.e. the virtual spread in a bare `super` call.
      return;
    }

    // `a...` → `...a...`
    //           ^^^
    this.insert(this.expression.outerStart, '...');
    this.expression.patch();
    // `...a...` → `...a`
    //      ^^^
    this.remove(this.expression.outerEnd, this.contentEnd);
  }
}
