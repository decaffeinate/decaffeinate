import BinaryOpPatcher from './BinaryOpPatcher';
import { SourceType } from 'coffee-lex';
import type { SourceToken } from './../../../patchers/types';

/**
 * Handles sequence expressions, e.g `a; b`.
 */
export default class SeqOpPatcher extends BinaryOpPatcher {
  /**
   * LEFT ';' RIGHT
   */
  patchAsExpression() {
    this.left.patch();

    let token = this.getOperatorToken();

    if (token.type === SourceType.SEMICOLON) {
      // `a; b` → `a, b`
      //   ^        ^
      this.overwrite(token.start, token.end, ',');
    } else if (token.type === SourceType.NEWLINE) {
      this.insert(this.left.outerEnd, ',');
    }

    this.right.patch();
  }

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken): boolean => token.type === SourceType.SEMICOLON || token.type === SourceType.NEWLINE;
  }
}
