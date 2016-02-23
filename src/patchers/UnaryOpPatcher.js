import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class UnaryOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  /**
   * OP EXPRESSION
   */
  patchAsExpression() {
    this.expression.patch();
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
