import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import type NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from '../../../patchers/types';

export default class DynamicMemberAccessOpPatcher extends PassthroughPatcher {
  expression: NodePatcher;
  indexingExpr: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(patcherContext, expression, indexingExpr);
    this.expression = expression;
    this.indexingExpr = indexingExpr;
  }
}
