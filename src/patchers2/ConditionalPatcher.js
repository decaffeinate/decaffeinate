import NodePatcher from './NodePatcher';

export default class ConditionalPatcher extends NodePatcher {
  constructor(node, context, editor, condition, consequent, alternate) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patch() {
    let { condition, consequent, alternate } = this;
    condition.patch();
    consequent.patch();
    alternate.patch();
  }
}
