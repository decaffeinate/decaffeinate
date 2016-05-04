import FunctionPatcher from './FunctionPatcher.js';

/**
 * Handles generator functions, i.e. produced by embedding `yield` statements.
 */
export default class GeneratorFunctionPatcher extends FunctionPatcher {
  patchFunctionStart({ method=false }) {
    this.log('Running with method=' + method);
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
