import BinaryOpPatcher from './BinaryOpPatcher.js';
import { SEMICOLON } from 'coffee-lex';
import type { SourceType } from './../../../patchers/types.js';

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
    // `a; b` → `a, b`
    //   ^        ^
    this.overwrite(token.start, token.end, ',');

    this.right.patch();
  }

  /**
   * @protected
   */
  expectedOperatorTokenType(): SourceType {
    return SEMICOLON;
  }
}
