import { SourceType, SourceToken } from 'coffee-lex';
import getCompareOperator from '../../../utils/getCompareOperator';
import isCompareOpNegationUnsafe from '../../../utils/isCompareOpNegationUnsafe';
import notNull from '../../../utils/notNull';
import BinaryOpPatcher from './BinaryOpPatcher';

/**
 * Handles equality and inequality comparisons.
 */
export default class EqualityPatcher extends BinaryOpPatcher {
  negated = false;

  patchOperator(): void {
    const compareToken = this.getCompareToken();
    this.overwrite(compareToken.start, compareToken.end, this.getCompareOperator());
  }

  getCompareOperator(): string {
    const token = this.getCompareToken();

    return getCompareOperator(this.sourceOfToken(token), this.negated);
  }

  private getCompareToken(): SourceToken {
    const { left, right } = this;
    const compareTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      (token) => token.type === SourceType.OPERATOR,
    );

    if (!compareTokenIndex) {
      throw this.error('expected OPERATOR token but none was found', left.outerEnd, right.outerStart);
    }

    return notNull(this.sourceTokenAtIndex(compareTokenIndex));
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`. If the negation is unsafe, fall back
   * to the superclass default behavior of just adding ! to the front.
   */
  negate(): void {
    if (
      isCompareOpNegationUnsafe(this.sourceOfToken(this.getCompareToken())) &&
      !this.options.looseComparisonNegation
    ) {
      return super.negate();
    }
    this.negated = !this.negated;
  }
}
