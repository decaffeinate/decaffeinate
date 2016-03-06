import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';

export default class ReturnPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: ?NodePatcher) {
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

  patchAsStatement() {
    if (this.expression) {
      this.expression.patch();
    }
  }
}
