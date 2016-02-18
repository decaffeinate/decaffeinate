import FunctionPatcher from './FunctionPatcher';

/**
 * Handles bound functions that cannot become arrow functions.
 */
export default class ManuallyBoundFunctionPatcher extends FunctionPatcher {
  patchAsStatement(options={}) {
    this.insertBefore('(');
    this.patchAsExpression(options);
    this.insertAfter('.bind(this))');
  }

  expectedArrowType(): string {
    return '=>';
  }
}
