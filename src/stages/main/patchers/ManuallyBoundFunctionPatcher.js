import FunctionPatcher from './FunctionPatcher.js';

/**
 * Handles bound functions that cannot become arrow functions.
 */
export default class ManuallyBoundFunctionPatcher extends FunctionPatcher {
  patchAsStatement(options={}) {
    this.insert(this.contentStart, '(');
    this.patchAsExpression(options);
    this.insert(this.contentEnd, '.bind(this))');
  }

  expectedArrowType(): string {
    return '=>';
  }
}
