/**
 * Determine if this operator is unsafe to convert under the getCompareOperator
 * algorithm. For example, `a < b` can't be negated to `a >= b` because it would
 * be incorrect if either variable is `NaN`.
 */
export default function isCompareOpNegationUnsafe(operator: string): boolean {
  return ['<', '>', '<=', '>='].indexOf(operator) > -1;
}
