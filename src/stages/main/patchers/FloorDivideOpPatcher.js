import BinaryOpPatcher from './BinaryOpPatcher.js';

export default class FloorDivideOpPatcher extends BinaryOpPatcher {
  /**
   * LEFT '//' RIGHT
   */
  patchAsExpression() {
    let operator = this.getOperatorToken();

    // `a // b` → `Math.floor(a // b`
    //             ^^^^^^^^^^^
    this.insert(this.contentStart, 'Math.floor(');

    this.left.patch();

    // `Math.floor(a // b)` → `Math.floor(a / b)`
    //               ^^                     ^
    this.overwrite(operator.start, operator.end, '/');

    this.right.patch();

    // `Math.floor(a // b` → `Math.floor(a // b)`
    //                                         ^
    this.insert(this.contentEnd, ')');
  }
}
