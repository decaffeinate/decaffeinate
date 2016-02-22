import NodePatcher from './NodePatcher';

export default class AssignOpPatcher extends NodePatcher {
  constructor(node, context, editor, assignee, expression) {
    super(node, context, editor);
    this.assignee = assignee;
    this.expression = expression;
    assignee.setRequiresExpression();
    expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.assignee.patch();
    this.expression.patch();
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
