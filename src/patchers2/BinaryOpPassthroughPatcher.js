import NodePatcher from './NodePatcher';

export default class BinaryOpPassthroughPatcher extends NodePatcher {
  constructor(node, context, editor, left, right) {
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
