import PassthroughPatcher from './../../../patchers/PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  isRepeatable(): boolean {
    return true;
  }

  /**
   * Currently, break and continue are parsed as identifiers, but they need to
   * behave differently in some cases.
   */
  canPatchAsExpression(): boolean {
    return this.node.data !== 'break' && this.node.data !== 'continue';
  }
}
