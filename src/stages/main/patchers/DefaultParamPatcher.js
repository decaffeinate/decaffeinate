import NodePatcher from '../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from '../../../patchers/types.js';

export default class DefaultParamPatcher extends NodePatcher {
  param: NodePatcher;
  value: NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, param: NodePatcher, value: NodePatcher) {
    super(node, context, editor);
    this.param = param;
    this.value = value;
  }

  initialize() {
    this.param.setRequiresExpression();
    this.value.setRequiresExpression();
  }
  
  patchAsExpression() {
    this.param.patch();
    this.value.patch();
  }
  
  patchAsStatement() {
    this.patchAsExpression();
  }
}
