import PassthroughPatcher from './../../../patchers/PassthroughPatcher.js';

export default class IdentifierPatcher extends PassthroughPatcher {
  negate() {
    this.insertAtStart('!');
  }

  isRepeatable(): boolean {
    return true;
  }
}
