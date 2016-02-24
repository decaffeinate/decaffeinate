import NodePatcher from './NodePatcher.js';

export default class SoakedMemberAccessOpPatcher extends NodePatcher {
  patchAsExpression() {

  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
