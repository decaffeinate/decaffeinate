import BinaryOpPatcher from './BinaryOpPatcher.js';
import { NEWLINE, SEMICOLON } from 'coffee-lex';
import type { SourceToken } from './../../../patchers/types.js';

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
    
    if (token.type === SEMICOLON) {
      // `a; b` → `a, b`
      //   ^        ^
      this.overwrite(token.start, token.end, ',');
    } else if (token.type === NEWLINE) {
      this.insert(this.left.outerEnd, ',');
    }

    this.right.patch();
  }

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken): boolean => token.type === SEMICOLON || token.type === NEWLINE;
  }
}
