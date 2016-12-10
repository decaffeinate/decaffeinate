import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

export default class ReturnPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.setExplicitlyReturns();
    if (this.expression !== null) {
      this.expression.setRequiresExpression();
    }
  }

  /**
   * Return statements cannot be expressions.
   */
  canPatchAsExpression(): boolean {
    return false;
  }

  patchAsStatement() {
    if (this.expression) {
      this.expression.patch();
    }
  }
}
