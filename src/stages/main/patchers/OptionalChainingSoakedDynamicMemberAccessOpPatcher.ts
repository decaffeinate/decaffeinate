import { SourceType } from 'coffee-lex';
import isInsideAssignee from '../../../utils/isInsideAssignee';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';

/**
 * Patches soaked dynamic member access operations while targeting optional
 * chaining. This is _almost_ a straight passthrough, but JavaScript adds a `.`
 * compared to CoffeeScript.
 *
 * @example
 *
 * This:
 *
 * ```coffee
 * a?[b]
 * ```
 *
 * Converts to this:
 *
 * ```js
 * a?.[b]
 * ```
 */
export default class OptionalChainingSoakedDynamicMemberAccessOpPatcher extends DynamicMemberAccessOpPatcher {
  patchAsExpression(): void {
    if (isInsideAssignee(this.node)) {
      throw this.error(
        `JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.`,
      );
    }

    const bracketTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.expression,
      this.indexingExpr,
      (token) => token.type === SourceType.LBRACKET,
    );

    if (!bracketTokenIndex) {
      throw this.error(`Expected left bracket between expression and index expression, but none was found`);
    }

    const bracketToken = this.sourceTokenAtIndex(bracketTokenIndex);

    if (!bracketToken) {
      throw this.error(`Expected left bracket between expression and index expression, but none was found`);
    }

    this.expression.patch();

    // `a?[b]` → `a?.[b]`
    //              ^
    this.insert(bracketToken.start, '.');

    this.indexingExpr.patch();
  }
}
