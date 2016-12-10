import NodePatcher from '../../../patchers/NodePatcher.js';
import type { PatcherContext } from '../../../patchers/types.js';

export default class DefaultParamPatcher extends NodePatcher {
  param: NodePatcher;
  value: NodePatcher;
  
  constructor(patcherContext: PatcherContext, param: NodePatcher, value: NodePatcher) {
    super(patcherContext);
    this.param = param;
    this.value = value;
  }

  initialize() {
    this.param.setRequiresExpression();
    this.value.setRequiresExpression();
  }
  
  patchAsExpression() {
    this.param.patch();
    this.value.patch();
  }
}
