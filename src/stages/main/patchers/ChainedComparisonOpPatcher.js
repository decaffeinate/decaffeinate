import NodePatcher from './../../../patchers/NodePatcher';
import getCompareOperator from '../../../utils/getCompareOperator';
import isCompareOpNegationUnsafe from '../../../utils/isCompareOpNegationUnsafe';
import type { PatcherContext } from './../../../patchers/types';

/**
 * Handles constructs of the form `a < b < c < … < z`.
 */
export default class ChainedComparisonOpPatcher extends NodePatcher {
  operands: Array<NodePatcher>;

  /**
   * `node` should have type `ChainedComparisonOp`.
   */
  constructor(patcherContext: PatcherContext, operands: Array<NodePatcher>) {
    super(patcherContext);
    this.operands = operands;
    this.negated = false;
  }

  initialize() {
    for (let operand of this.operands) {
      operand.setRequiresExpression();
    }
  }

  patchAsExpression() {
    let negateEntireExpression = this.shouldNegateEntireExpression();
    if (negateEntireExpression) {
      this.insert(this.contentStart, '!(');
    }

    let middle = this.getMiddleOperands();
    let negated = !negateEntireExpression && this.negated;
    let logicalOperator = negated ? '||' : '&&';

    for (let operand of middle) {
      operand.setRequiresRepeatableExpression({ parens: true, ref: 'middle' });
    }

    for (let [i, operand] of this.operands.entries()) {
      operand.patch();

      let operator = this.node.operators[i];

      if (operator) {
        let replacement = getCompareOperator(operator.operator, negated);

        if (operator.operator !== replacement) {
          this.overwrite(operator.token.start, operator.token.end, replacement);
        }
      }
    }

    for (let operand of middle) {
      // `a < b < c` → `a < b && b < c`
      //                     ^^^^^
      this.insert(
        operand.outerEnd,
        ` ${logicalOperator} ${operand.getRepeatCode()}`
      );
    }

    if (negateEntireExpression) {
      this.insert(this.contentEnd, ')');
    }
  }

  /**
   * If any negation is unsafe, just wrap the whole thing in parens with a !
   * operator. That's easier and arguably nicer-looking than trying to
   * intelligently negate the subexpressions accounting for unsafe negations.
   */
  shouldNegateEntireExpression() {
    return this.negated &&
      this.node.operators.some(operator => isCompareOpNegationUnsafe(operator.operator)) &&
      !this.options.looseComparisonNegation;
  }

  /**
   * @private
   */
  getMiddleOperands(): Array<NodePatcher> {
    return this.operands.slice(1, -1);
  }

  negate() {
    this.negated = !this.negated;
  }

  /**
   * Forward the request to the first operand.
   */
  statementNeedsParens(): boolean {
    return this.operands[0].statementShouldAddParens();
  }
}
