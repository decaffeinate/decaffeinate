import ForPatcher from './ForPatcher.js';
import type NodePatcher from '../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

export default class ForInPatcher extends ForPatcher {
  step: ?NodePatcher;
  
  constructor(patcherContext: PatcherContext, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: NodePatcher) {
    super(patcherContext, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  patchAsExpression() {
    super.patchAsExpression();
    if (this.step) {
      this.step.patch();
    }
  }
}
