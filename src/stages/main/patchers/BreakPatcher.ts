import NodePatcher from '../../../patchers/NodePatcher';

export default class BreakPatcher extends NodePatcher {
  patchAsStatement(): void {
    // nothing to do
  }

  canPatchAsExpression(): boolean {
    return false;
  }
}
