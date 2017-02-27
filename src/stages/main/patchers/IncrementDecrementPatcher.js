import NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from '../../../patchers/types';

export default class IncrementDecrementPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.expression.patch();
  }

  isRepeatable() {
    return false;
  }
}
