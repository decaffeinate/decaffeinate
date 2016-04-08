import BinaryOpPatcher from './BinaryOpPatcher.js';
import type { SourceToken } from './../../../patchers/types.js';
import { OPERATOR } from 'coffee-lex';

/**
 * Handles equality and inequality comparisons.
 */
export default class EqualityPatcher extends BinaryOpPatcher {
  negated: boolean = false;
  
  patchAsExpression() {
    this.left.patch();
    let compareToken = this.getCompareToken();
    this.overwrite(
      compareToken.start,
      compareToken.end,
      this.getCompareOperator()
    );
    this.right.patch();
  }

  getCompareOperator(): string {
    switch (this.node.type) {
      case 'EQOp':
        return this.negated ? '!==' : '===';

      case 'NEQOp':
        return this.negated ? '===' : '!==';

      case 'LTOp':
        return this.negated ? '>=' : '<';

      case 'GTOp':
        return this.negated ? '<=' : '>';

      case 'LTEOp':
        return this.negated ? '>' : '<=';

      case 'GTEOp':
        return this.negated ? '<' : '>=';

      default:
        throw this.error(
          `unsupported equality/inequality type: ${this.node.type}`
        );
    }
  }

  /**
   * @private
   */
  getCompareToken(): SourceToken {
    let { left, right } = this;
    let compareTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === OPERATOR
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
