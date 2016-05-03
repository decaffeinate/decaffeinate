import NodePatcher from './../../../patchers/NodePatcher.js';

export default class SoakedMemberAccessOpPatcher extends NodePatcher {
  patchAsExpression() {
    throw this.error(
      'cannot patch soaked member access (e.g. `a?.b`) yet,' +
      'see https://github.com/decaffeinate/decaffeinate/issues/176'
    );
  }
}
