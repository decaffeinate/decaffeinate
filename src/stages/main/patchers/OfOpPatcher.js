import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher.js';
import type { SourceToken } from './../../../patchers/types.js';
import { SourceType } from 'coffee-lex';

/**
 * Handles `of` operators, e.g. `a of b` and `a not of b`.
 */
export default class OfOpPatcher extends NegatableBinaryOpPatcher {
  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === SourceType.RELATION;
  }

  javaScriptOperator() {
    return 'in';
  }
}
