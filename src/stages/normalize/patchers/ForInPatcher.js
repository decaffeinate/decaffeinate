import ForPatcher from './ForPatcher';
import type NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class ForInPatcher extends ForPatcher {
  step: ?NodePatcher;
  
  constructor(patcherContext: PatcherContext, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: NodePatcher) {
    super(patcherContext, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  patchAsExpression() {
    if (this.step) {
      this.step.patch();
    }
    super.patchAsExpression();
  }
}
