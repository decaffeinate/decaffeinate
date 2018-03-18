import NodePatcher from './../../../patchers/NodePatcher';

export default class ElisionPatcher extends NodePatcher {
  _elisionPatcherBrand: never;

  patchAsExpression(): void {
    // Nothing to patch.
  }
}
