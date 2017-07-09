import { PatchOptions } from '../../../patchers/types';
import FunctionPatcher from './FunctionPatcher';

/**
 * Handles bound functions that cannot become arrow functions.
 */
export default class ManuallyBoundFunctionPatcher extends FunctionPatcher {
  patchAsStatement(options: PatchOptions = {}): void {
    this.insert(this.innerStart, '(');
    super.patchAsExpression(options);
    this.insert(this.innerEnd, '.bind(this))');
  }

  patchAsExpression(options: PatchOptions = {}): void {
    super.patchAsExpression(options);
    // If we're instructed to patch as a method, then it won't be legal to add
    // `.bind(this)`, so skip that step. Calling code is expected to bind us
    // some other way. In practice, this happens when patching class methods;
    // code will be added to the constructor to bind the method properly.
    if (!options.method) {
      this.insert(this.innerEnd, '.bind(this)');
    }
  }

  expectedArrowType(): string {
    return '=>';
  }
}
