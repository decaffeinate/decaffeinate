import ForPatcher from './ForPatcher.js';
import type NodePatcher from '../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class ForInPatcher extends ForPatcher {
  step: ?NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: NodePatcher) {
    super(node, context, editor, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  patchAsExpression() {
    super.patchAsExpression();
    if (this.step) {
      this.step.patch();
    }
  }
}
