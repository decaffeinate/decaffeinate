import { PatchOptions } from '../../../patchers/types';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';

export default class BoundGeneratorFunctionPatcher extends ManuallyBoundFunctionPatcher {
  patchFunctionStart({method = false}: PatchOptions = {}): void {
    let arrow = this.getArrowToken();

    if (!method) {
      this.insert(this.contentStart, 'function*');
    }

    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }
}
