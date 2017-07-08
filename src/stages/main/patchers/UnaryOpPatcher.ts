import { PatcherContext, PatchOptions } from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';

export default class UnaryOpPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize(): void {
    this.expression.setRequiresExpression();
  }

  /**
   * OP EXPRESSION
   */
  patchAsExpression(options: PatchOptions = {}): void {
    this.expression.patch({ ...options, needsParens: true });
  }

  /**
   * If `EXPRESSION` needs parens then `EXPRESSION OP` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }
}
