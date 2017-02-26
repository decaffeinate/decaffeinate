import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class UnaryOpPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  /**
   * OP EXPRESSION
   */
  patchAsExpression() {
    this.expression.patch({ needsParens: true });
  }

  /**
   * If `EXPRESSION` needs parens then `EXPRESSION OP` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }
}
