import BinaryOpPatcher from './BinaryOpPatcher';

export default class FloorDivideOpPatcher extends BinaryOpPatcher {
  /**
   * LEFT '//' RIGHT
   */
  patchAsExpression(): void {
    let operator = this.getOperatorToken();

    // `a // b` → `Math.floor(a // b`
    //             ^^^^^^^^^^^
    this.insert(this.contentStart, 'Math.floor(');

    this.left.patch({ needsParens: true });

    // `Math.floor(a // b)` → `Math.floor(a / b)`
    //               ^^                     ^
    this.overwrite(operator.start, operator.end, '/');

    this.right.patch({ needsParens: true });

    // `Math.floor(a // b` → `Math.floor(a // b)`
    //                                         ^
    this.insert(this.contentEnd, ')');
  }

  /**
   * We always prefix with `Math.floor`, so no need for parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
