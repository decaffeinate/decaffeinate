import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class BinaryOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }

  initialize() {
    this.left.setRequiresExpression();
    this.right.setRequiresExpression();
  }

  patch() {
    this.left.patch();
    this.right.patch();
  }
}
