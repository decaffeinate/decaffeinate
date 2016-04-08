import NodePatcher from './../../../patchers/NodePatcher.js';

export default class SoakedMemberAccessOpPatcher extends NodePatcher {
  patchAsExpression() {
    throw this.error('cannot patch soaked member access (e.g. `a?.b`) yet');
  }
}
