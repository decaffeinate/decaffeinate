import NodePatcher from './../../../patchers/NodePatcher';

export default class BareSuperFunctionApplicationPatcher extends NodePatcher {
  patchAsExpression() {
    this.insert(this.contentEnd, '(arguments...)');
  }
}
