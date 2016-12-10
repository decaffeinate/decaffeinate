import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

export default class YieldFromPatcher extends NodePatcher {
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
   * 'yield' 'from' EXPRESSION
   */
  patchAsExpression({ needsParens=true }={}) {
    let src = this.sourceTokenAtIndex(this.contentStartTokenIndex);
    this.overwrite(src.start, src.end, 'yield*');
    
    this.expression.patch({ needsParens });
  }
}
