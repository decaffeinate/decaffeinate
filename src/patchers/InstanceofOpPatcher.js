import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher.js';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class InstanceofOpPatcher extends NegatableBinaryOpPatcher {
  javaScriptOperator() {
    return 'instanceof';
  }
}
