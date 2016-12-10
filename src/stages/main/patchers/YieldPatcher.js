import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

export default class YieldPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }
  
  initialize() {
    this.yields();
    this.expression.setRequiresExpression();
  }

  /**
   * 'yield' EXPRESSION
   */
  patchAsExpression({ needsParens=true }={}) {
    this.expression.patch({ needsParens });
  }
}
