import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, assignee: NodePatcher, expression: NodePatcher) {
    super(node, context, editor);
    this.assignee = assignee;
    this.expression = expression;
  }

  initialize() {
    this.assignee.setRequiresExpression();
    this.expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.assignee.patch();
    this.expression.patch();
  }

  /**
   * The assignment needs parentheses when the LHS needs parens.
   */
  statementNeedsParens(): boolean {
    return this.assignee.statementShouldAddParens();
  }
}
