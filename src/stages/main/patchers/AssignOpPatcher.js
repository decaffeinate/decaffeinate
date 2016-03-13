import NodePatcher from './../../../patchers/NodePatcher.js';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class AssignOpPatcher extends NodePatcher {
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

  patchAsStatement() {
    let needsParens = (
      this.assignee instanceof ObjectInitialiserPatcher &&
      !this.isSurroundedByParentheses()
    );
    if (needsParens) {
      this.insert(this.outerStart, '(');
    }
    this.patchAsExpression();
    if (needsParens) {
      this.insert(this.outerEnd, ')');
    }
  }
}
