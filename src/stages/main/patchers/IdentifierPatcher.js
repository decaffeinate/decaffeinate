import PassthroughPatcher from './../../../patchers/PassthroughPatcher.js';

export default class IdentifierPatcher extends PassthroughPatcher {
  negate() {
    this.insert(this.contentStart, '!');
  }

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
