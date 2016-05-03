import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';

export default class SoakedFunctionApplicationPatcher extends FunctionApplicationPatcher {
  patchAsExpression() {
    throw this.error(
      'cannot patch soaked function calls (e.g. `a?()`) yet, ' +
      'see https://github.com/decaffeinate/decaffeinate/issues/176'
    );
  }
}
