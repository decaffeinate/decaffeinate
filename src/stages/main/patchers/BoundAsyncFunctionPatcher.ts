import BoundFunctionPatcher from './BoundFunctionPatcher';

export default class BoundAsyncFunctionPatcher extends BoundFunctionPatcher {
  patchFunctionStart(): void {
    this.insert(this.contentStart, 'async ');
    super.patchFunctionStart();
  }
}
