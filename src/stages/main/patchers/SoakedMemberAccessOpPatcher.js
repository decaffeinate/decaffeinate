import NodePatcher from './../../../patchers/NodePatcher.js';

export default class SoakedMemberAccessOpPatcher extends NodePatcher {
  patchAsExpression() {

  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
