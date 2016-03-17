import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher.js';
import type { SourceType } from './../../../patchers/types.js';
import { RELATION } from 'coffee-lex';

/**
 * Handles `of` operators, e.g. `a of b` and `a not of b`.
 */
export default class OfOpPatcher extends NegatableBinaryOpPatcher {
  expectedOperatorTokenType(): SourceType {
    return RELATION;
  }

  javaScriptOperator() {
    return 'in';
  }
}
