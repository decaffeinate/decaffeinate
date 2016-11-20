import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher.js';

export default class BoundGeneratorFunctionPatcher extends ManuallyBoundFunctionPatcher {
  patchFunctionStart({ method=false }) {
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
