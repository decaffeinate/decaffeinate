import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import NegatableBinaryOpPatcher from './NegatableBinaryOpPatcher';

/**
 * Handles `of` operators, e.g. `a of b` and `a not of b`.
 */
export default class OfOpPatcher extends NegatableBinaryOpPatcher {
  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === SourceType.RELATION;
  }

  javaScriptOperator(): string {
    return 'in';
  }
}
