import PassthroughPatcher from './PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  negate() {
    this.insertAtStart('!');
  }
}
