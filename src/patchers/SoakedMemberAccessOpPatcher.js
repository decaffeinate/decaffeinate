import NodePatcher from './NodePatcher';

export default class SoakedMemberAccessOpPatcher extends NodePatcher {
  patchAsExpression() {

  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
