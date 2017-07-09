import FunctionPatcher from './FunctionPatcher';

/**
 * Handles generator functions, i.e. produced by embedding `yield` statements.
 */
export default class GeneratorFunctionPatcher extends FunctionPatcher {
  patchFunctionStart({method=false}: {method: boolean}): void {
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
