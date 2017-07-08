import NodePatcher from '../../../patchers/NodePatcher';

export default class ContinuePatcher extends NodePatcher {
  patchAsStatement(): void {
    // nothing to do
  }

  canPatchAsExpression(): boolean {
    return false;
  }
}
