import FunctionPatcher from './FunctionPatcher';

export default class AsyncFunctionPatcher extends FunctionPatcher {
  patchFunctionStart({method=false}: {method: boolean}): void {
    let arrow = this.getArrowToken();

    if (!method) {
      this.insert(this.contentStart, 'async function');
    }
    
    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }
}
