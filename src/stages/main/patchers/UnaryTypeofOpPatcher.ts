import UnaryOpPatcher from './UnaryOpPatcher';

/**
 * Handles `typeof`, e.g. `typeof name`.
 */
export default class UnaryTypeofOpPatcher extends UnaryOpPatcher {
  /**
   * `typeof` does not have side-effects.
   */
  isRepeatable(): boolean {
    return this.expression.isRepeatable();
  }

  /**
   * This always starts with `typeof` and doesn't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
