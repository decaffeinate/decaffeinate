import BinaryOpPatcher from './BinaryOpPatcher';
import IdentifierPatcher from './IdentifierPatcher';

export default class ExistsOpPatcher extends BinaryOpPatcher {
  /**
   * LEFT '?' RIGHT → `LEFT != null ? LEFT : RIGHT`
   */
  patchAsExpression() {
    let needsTypeofCheck = (
      this.left instanceof IdentifierPatcher &&
      !this.node.scope.hasBinding(this.left.node.data)
    );
    if (needsTypeofCheck) {
      // `a ? b` → `typeof a ? b`
      //            ^^^^^^^
      this.insert(this.contentStart, `typeof `);
      let leftAgain = this.left.makeRepeatable(true, 'left');
      this.left.patch();
      // `typeof a ? b` → `typeof a !== 'undefined' && a !== null ? a : b`
      //          ^^^              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.overwrite(
        this.left.outerEnd,
        this.right.outerStart,
        ` !== 'undefined' && ${leftAgain} !== null ? ${leftAgain} : `
      );
    } else {
      let leftAgain = this.left.makeRepeatable(true, 'left');
      this.left.patch();
      // `a.b ? c` → `a.b != null ? a.b : c`
      //     ^^^         ^^^^^^^^^^^^^^^^^
      this.overwrite(
        this.left.outerEnd,
        this.right.outerStart,
        ` != null ? ${leftAgain} : `
      );
    }
    this.right.patch();
  }

  /**
   * LEFT '?' RIGHT → `if (LEFT == null) { RIGHT }`
   */
  patchAsStatement() {
    let needsTypeofCheck = (
      this.left instanceof IdentifierPatcher &&
      !this.node.scope.hasBinding(this.left.node.data)
    );
    // `a ? b` → `if (a ? b`
    //            ^^^
    this.insert(this.contentStart, `if (`);
    this.left.patch();
    if (needsTypeofCheck) {
      let leftAgain = this.left.makeRepeatable();
      // `if (a ? b` → `if (typeof a ? b`
      //                    ^^^^^^^
      this.insert(this.contentStart, `typeof `);
      // `if (typeof a ? b` → `if (typeof a === 'undefined' || a === null) { b`
      //              ^^^                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.overwrite(
        this.left.outerEnd,
        this.right.outerStart,
        ` === 'undefined' || ${leftAgain} === null) { `
      );
    } else {
      // `if (a.b ? b.c` → `if (a.b == null) { b.c`
      //         ^^^               ^^^^^^^^^^^^
      this.overwrite(
        this.left.outerEnd,
        this.right.outerStart,
        ` == null) { `
      );
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
