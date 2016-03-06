import PassthroughPatcher from './PassthroughPatcher.js';

export default class IdentifierPatcher extends PassthroughPatcher {
  negate() {
    this.insertAtStart('!');
  }

  isRepeatable(): boolean {
    return true;
  }
}
