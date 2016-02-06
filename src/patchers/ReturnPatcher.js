import NodePatcher from './NodePatcher';

export default class ReturnPatcher extends NodePatcher {
  constructor(node, context, editor, expression) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.setReturns(true);
  }

  /**
   * Return statements cannot be expressions.
   */
  canPatchAsExpression(): boolean {
    return false;
  }

  patch() {
    let { expression } = this;
    expression.patch();
  }
}
