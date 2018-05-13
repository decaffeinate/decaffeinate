import { UnaryExistsOp } from 'decaffeinate-parser/dist/nodes';
import { PatchOptions } from '../../../patchers/types';
import { SHORTEN_NULL_CHECKS } from '../../../suggestions';
import UnaryOpPatcher from './UnaryOpPatcher';

/**
 * Handles unary exists, e.g. `a?`.
 */
export default class UnaryExistsOpPatcher extends UnaryOpPatcher {
  node: UnaryExistsOp;
  negated: boolean = false;

  /**
   * The expression version of this sometimes needs parentheses, but we don't
   * yet have a good mechanism for determining when that is, so we just make
   * sure they're always there. For example, this doesn't need parentheses:
   *
   *   set = a?
   *
   * Because it becomes this:
   *
   *   var set = typeof a !== 'undefined' && a !== null;
   *
   * But this does:
   *
   *   'set? ' + a?
   *
   * Because this:
   *
   *   'set? ' + a != null;
   *
   * Is equivalent to this:
   *
   *   ('set? + a) != null;
   *
   * Which has a different meaning than this:
   *
   *   'set? ' + (a != null);
   */
  patchAsExpression({ needsParens = true }: PatchOptions = {}): void {
    let addParens = needsParens && !this.isSurroundedByParentheses();
    if (addParens) {
      // `a?` → `(a?`
      //         ^
      this.insert(this.contentStart, '(');
    }
    this.patchAsStatement();
    if (addParens) {
      // `(a?` → `(a?)`
      //             ^
      this.insert(this.contentEnd, ')');
    }
  }

  /**
   * EXPRESSION '?'
   */
  patchAsStatement(): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    let {
      node: { expression },
      negated
    } = this;
    let needsTypeofCheck = this.needsTypeofCheck();

    this.expression.patch();
    if (needsTypeofCheck) {
      if (negated) {
        // `a?` → `typeof a === 'undefined' && a === null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(
          this.contentStart,
          this.contentEnd,
          `typeof ${expression.raw} === 'undefined' || ${expression.raw} === null`
        );
      } else {
        // `a?` → `typeof a !== 'undefined' && a !== null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(
          this.contentStart,
          this.contentEnd,
          `typeof ${expression.raw} !== 'undefined' && ${expression.raw} !== null`
        );
      }
    } else {
      if (negated) {
        // `a.b?` → `a.b == null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.outerEnd, this.contentEnd, ' == null');
      } else {
        // `a.b?` → `a.b != null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.outerEnd, this.contentEnd, ' != null');
      }
    }
  }

  /**
   * Since we turn into an equality check, we can simply invert the operator
   * to handle negation internally rather than by prefixing with `!`.
   */
  canHandleNegationInternally(): boolean {
    return true;
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate(): void {
    this.negated = !this.negated;
  }

  /**
   * @private
   */
  needsTypeofCheck(): boolean {
    return this.expression.mayBeUnboundReference();
  }

  /**
   * When we prefix with a `typeof` check we don't need parens, otherwise
   * delegate.
   */
  statementNeedsParens(): boolean {
    if (this.needsTypeofCheck()) {
      return false;
    } else {
      return this.expression.statementShouldAddParens();
    }
  }
}
