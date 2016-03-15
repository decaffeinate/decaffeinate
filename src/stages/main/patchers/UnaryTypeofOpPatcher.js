import UnaryOpPatcher from './UnaryOpPatcher.js';

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
}
