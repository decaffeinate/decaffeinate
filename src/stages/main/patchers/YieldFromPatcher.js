import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class YieldFromPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
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
