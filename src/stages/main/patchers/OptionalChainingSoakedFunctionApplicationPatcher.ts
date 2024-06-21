import { SourceType } from 'coffee-lex';
import isInsideAssignee from '../../../utils/isInsideAssignee';
import notNull from '../../../utils/notNull';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';

/**
 * Patches soaked function applications while targeting optional chaining. This
 * is _almost_ a straight passthrough, but JavaScript adds a `.` compared to
 * CoffeeScript.
 *
 * @example
 *
 * This:
 *
 * ```coffee
 * a?(b)
 * ```
 *
 * Converts to this:
 *
 * ```js
 * a?.(b)
 * ```
 */
export default class OptionalChainingSoakedFunctionApplicationPatcher extends FunctionApplicationPatcher {
  patchAsExpression(): void {
    if (isInsideAssignee(this.node)) {
      throw this.error(
        `JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.`,
      );
    }

    const existenceTokenIndex = notNull(
      this.indexOfSourceTokenAfterSourceTokenIndex(this.fn.outerEndTokenIndex, SourceType.EXISTENCE),
    );
    const lparenTokenIndex = notNull(
      this.indexOfSourceTokenAfterSourceTokenIndex(existenceTokenIndex, SourceType.CALL_START),
    );
    const lparenToken = notNull(this.sourceTokenAtIndex(lparenTokenIndex));

    // `a?(b)` → `a?.(b)`
    //              ^
    this.insert(lparenToken.start, '.');

    super.patchAsExpression();
  }
}
