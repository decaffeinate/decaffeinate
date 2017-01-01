import PassthroughPatcher from './../../../patchers/PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  isRepeatable(): boolean {
    return true;
  }
}
