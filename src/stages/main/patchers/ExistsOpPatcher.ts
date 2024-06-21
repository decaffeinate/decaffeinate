import { SHORTEN_NULL_CHECKS } from '../../../suggestions';
import BinaryOpPatcher from './BinaryOpPatcher';
import { PatchOptions } from '../../../patchers/types';

export default class ExistsOpPatcher extends BinaryOpPatcher {
  /**
   * If we are a statement, the RHS should be patched as a statement.
   */
  rhsMayBeStatement(): boolean {
    return true;
  }

  setExpression(force: boolean): boolean {
    this.right.setRequiresExpression();
    return super.setExpression(force);
  }

  /**
   * LEFT '?' RIGHT → `LEFT != null ? LEFT : RIGHT`
   */
  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    const addParens = (needsParens && !this.isSurroundedByParentheses()) || this.binaryOpNegated;
    if (this.binaryOpNegated) {
      this.insert(this.contentStart, '!');
    }
    if (addParens) {
      this.insert(this.contentStart, '(');
    }
    const needsTypeofCheck = this.left.mayBeUnboundReference();
    if (needsTypeofCheck) {
      // `a ? b` → `typeof a ? b`
      //            ^^^^^^^
      this.insert(this.contentStart, `typeof `);
      const leftAgain = this.left.patchRepeatable({ parens: true, ref: 'left' });
      // `typeof a ? b` → `typeof a !== 'undefined' && a !== null ? a : b`
      //          ^^^              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.overwrite(
        this.left.outerEnd,
        this.right.outerStart,
        ` !== 'undefined' && ${leftAgain} !== null ? ${leftAgain} : `,
      );
    } else {
      const leftAgain = this.left.patchRepeatable({ parens: true, ref: 'left' });
      // `a.b ? c` → `a.b != null ? a.b : c`
      //     ^^^         ^^^^^^^^^^^^^^^^^
      this.overwrite(this.left.outerEnd, this.right.outerStart, ` != null ? ${leftAgain} : `);
    }
    this.right.patch();
    if (addParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  /**
   * LEFT '?' RIGHT → `if (LEFT == null) { RIGHT }`
   */
  patchAsStatement(): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    const needsTypeofCheck = this.left.mayBeUnboundReference();
    // `a ? b` → `if (a ? b`
    //            ^^^
    this.insert(this.contentStart, `if (`);
    if (needsTypeofCheck) {
      const leftAgain = this.left.patchRepeatable();
      // `if (a ? b` → `if (typeof a ? b`
      //                    ^^^^^^^
      this.insert(this.contentStart, `typeof `);
      // `if (typeof a ? b` → `if (typeof a === 'undefined' || a === null) { b`
      //              ^^^                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.overwrite(this.left.outerEnd, this.right.outerStart, ` === 'undefined' || ${leftAgain} === null) { `);
    } else {
      this.left.patch();
      // `if (a.b ? b.c` → `if (a.b == null) { b.c`
      //         ^^^               ^^^^^^^^^^^^
      this.overwrite(this.left.outerEnd, this.right.outerStart, ` == null) { `);
    }

    this.right.patch();
    // `if (a.b == null) { b.c` → `if (a.b == null) { b.c }`
    //                                                   ^^
    this.insert(this.innerEnd, ` }`);
  }

  /**
   * We'll always start with an `if` so we don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
