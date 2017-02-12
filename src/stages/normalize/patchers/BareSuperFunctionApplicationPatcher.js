import NodePatcher from './../../../patchers/NodePatcher';

export default class FunctionApplicationPatcher extends NodePatcher {
  patchAsExpression() {
    this.insert(this.contentEnd, '(arguments...)');
  }
}
