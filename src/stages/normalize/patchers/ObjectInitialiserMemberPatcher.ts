import NodePatcher from '../../../patchers/NodePatcher';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import { PatcherContext } from '../../../patchers/types';

export default class ObjectInitialiserMemberPatcher extends PassthroughPatcher {
  key: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, key: NodePatcher, expression: NodePatcher) {
    super(patcherContext, key, expression);
    this.key = key;
    this.expression = expression;
  }
}
