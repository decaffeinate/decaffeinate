import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class BinaryOpPassthroughPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }

  patch() {
    let { left, right } = this;
    left.patch();
    right.patch();
  }
}
