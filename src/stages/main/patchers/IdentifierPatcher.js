import PassthroughPatcher from './../../../patchers/PassthroughPatcher.js';

export default class IdentifierPatcher extends PassthroughPatcher {
  negate() {
    this.insert(this.contentStart, '!');
  }

  isRepeatable(): boolean {
    return true;
  }
}
