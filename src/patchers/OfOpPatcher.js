import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher.js';

/**
 * Handles `of` operators, e.g. `a of b` and `a not of b`.
 */
export default class OfOpPatcher extends NegatableBinaryOpPatcher {
  /**
   * @protected
   */
  javaScriptOperator() {
    return 'in';
  }
}
