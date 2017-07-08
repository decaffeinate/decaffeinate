import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class InstanceofOpPatcher extends NegatableBinaryOpPatcher {
  javaScriptOperator(): string {
    return 'instanceof';
  }
}
