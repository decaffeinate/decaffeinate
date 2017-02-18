import PassthroughPatcher from './../../../patchers/PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  isRepeatable(): boolean {
    return true;
  }

  /**
   * Determine if this identifier might refer to a non-existent variable. In
   * that case, some code paths need to emit a `typeof` check to ensure that
   * we don't crash if this variable hasn't been declared.
   */
  mayBeUnboundReference() {
    return !this.node.scope.hasBinding(this.node.data);
  }
}
