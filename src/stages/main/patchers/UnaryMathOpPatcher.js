import UnaryOpPatcher from './UnaryOpPatcher';

/**
 * Handles unary math operators, e.g. `+a`, `-a`, `~a`.
 */
export default class UnaryMathOpPatcher extends UnaryOpPatcher {
  /**
   * Math does not (usually) have side effects, as far as CoffeeScript is
   * concerned. It could trigger a `valueOf` call that could trigger arbitrary
   * code, but we ignore that possibility.
   */
  isRepeatable(): boolean {
    return this.expression.isRepeatable();
  }
}
