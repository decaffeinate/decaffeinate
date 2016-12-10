import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class DefaultParamPatcher extends PassthroughPatcher {
  param: NodePatcher;
  value: NodePatcher;

  constructor(patcherContext: PatcherContext, param: NodePatcher, value: NodePatcher) {
    super(patcherContext, param, value);
    this.param = param;
    this.value = value;
  }
}
