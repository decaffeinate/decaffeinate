import NodePatcher from './NodePatcher.js';

export default class ReturnPatcher extends NodePatcher {
  constructor(node, context, editor, expression) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.setExplicitlyReturns();
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
