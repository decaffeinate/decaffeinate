import NodePatcher from './NodePatcher';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher';

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
    let needsParens = (
      this.assignee instanceof ObjectInitialiserPatcher &&
      !this.isSurroundedByParentheses()
    );
    if (needsParens) {
      this.insertBefore('(');
    }
    this.patchAsExpression();
    if (needsParens) {
      this.insertAfter(')');
    }
  }
}
