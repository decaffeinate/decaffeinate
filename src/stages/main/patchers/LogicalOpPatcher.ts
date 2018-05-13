import BinaryOpPatcher from './BinaryOpPatcher';

/**
 * Handles logical AND and logical OR.
 *
 * This class is primarily responsible for rewriting `and` to `&&` and `or` to
 * `||`. It also applies De Morgan's laws [1] in the event of negation, such as
 * when used as the condition of an `unless` expression:
 *
 *   a unless b && c  # equivalent to `a if !b || !c`
 *
 * [1]: https://en.wikipedia.org/wiki/De_Morgan%27s_laws
 */
export default class LogicalOpPatcher extends BinaryOpPatcher {
  negated: boolean = false;

  patchOperator(): void {
    let operatorToken = this.getOperatorToken();
    this.overwrite(operatorToken.start, operatorToken.end, this.getOperator());
  }

  /**
   * Apply De Morgan's law.
   *
   * @private
   */
  getOperator(): string {
    let operatorToken = this.getOperatorToken();
    let operator = this.context.source.slice(operatorToken.start, operatorToken.end);
    if (operator === 'and') {
      operator = '&&';
    } else if (operator === 'or') {
      operator = '||';
    }
    if (this.negated) {
      return operator === '&&' ? '||' : '&&';
    } else {
      return operator;
    }
  }

  negate(): void {
    this.negated = !this.negated;
    this.left.negate();
    this.right.negate();
  }
}
