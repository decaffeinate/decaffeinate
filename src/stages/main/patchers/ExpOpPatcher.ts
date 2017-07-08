import BinaryOpPatcher from './BinaryOpPatcher';

/**
 * Handles exponentiation, i.e. `a ** b`.
 */
export default class ExpOpPatcher extends BinaryOpPatcher {
  /**
   * LEFT '**' RIGHT
   */
  patchAsExpression(): void {
    // `a ** b` → `Math.pow(a ** b`
    //             ^^^^^^^^^
    this.insert(this.contentStart, `Math.pow(`);

    this.left.patch();

    // `Math.pow(a ** b` → `Math.pow(a, b`
    //            ^^^^                ^^
    this.overwrite(this.left.outerEnd, this.right.outerStart, ', ');

    this.right.patch();

    // `Math.pow(a, b` → `Math.pow(a, b)`
    //                                 ^
    this.insert(this.contentEnd, `)`);
  }

  /**
   * We'll always start with `Math.pow` so we don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
