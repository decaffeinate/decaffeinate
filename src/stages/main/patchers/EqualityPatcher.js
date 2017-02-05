import BinaryOpPatcher from './BinaryOpPatcher';
import getCompareOperator from '../../../utils/getCompareOperator';
import type { SourceToken } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

/**
 * Handles equality and inequality comparisons.
 */
export default class EqualityPatcher extends BinaryOpPatcher {
  negated: boolean = false;

  patchOperator() {
    let compareToken = this.getCompareToken();
    this.overwrite(
      compareToken.start,
      compareToken.end,
      this.getCompareOperator()
    );
  }

  getCompareOperator(): string {
    let token = this.getCompareToken();

    return getCompareOperator(this.sourceOfToken(token), this.negated);
  }

  /**
   * @private
   */
  getCompareToken(): SourceToken {
    let { left, right } = this;
    let compareTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === SourceType.OPERATOR
    );

    if (!compareTokenIndex) {
      throw this.error(
        'expected OPERATOR token but none was found',
        left.outerEnd,
        right.outerStart
      );
    }

    return this.sourceTokenAtIndex(compareTokenIndex);
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate() {
    this.negated = !this.negated;
  }
}
