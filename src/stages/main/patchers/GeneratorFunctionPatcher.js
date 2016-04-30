import FunctionPatcher from './FunctionPatcher.js';

/**
 * Handles bound functions, i.e. "fat arrows".
 */
export default class GeneratorFunctionPatcher extends FunctionPatcher {

  patchFunctionStart() {
    let arrow = this.getArrowToken();

    this.insert(this.contentStart, 'function*');
    
    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }


}
