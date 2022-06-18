import { ChainedComparisonOp } from 'decaffeinate-parser';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import getCompareOperator from '../../../utils/getCompareOperator';
import isCompareOpNegationUnsafe from '../../../utils/isCompareOpNegationUnsafe';
import NodePatcher from './../../../patchers/NodePatcher';

/**
 * Handles constructs of the form `a < b < c < … < z`.
 */
export default class ChainedComparisonOpPatcher extends NodePatcher {
  node!: ChainedComparisonOp;
  operands: Array<NodePatcher>;
  negated = false;

  /**
   * `node` should have type `ChainedComparisonOp`.
   */
  constructor(patcherContext: PatcherContext, operands: Array<NodePatcher>) {
    super(patcherContext);
    this.operands = operands;
  }

  initialize(): void {
    for (const operand of this.operands) {
      operand.setRequiresExpression();
    }
  }

  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    const negateEntireExpression = this.shouldNegateEntireExpression();
    const addParens = negateEntireExpression || (needsParens && !this.isSurroundedByParentheses());
    if (negateEntireExpression) {
      this.insert(this.contentStart, '!');
    }
    if (addParens) {
      this.insert(this.contentStart, '(');
    }

    const middle = this.getMiddleOperands();
    const negated = !negateEntireExpression && this.negated;
    const logicalOperator = negated ? '||' : '&&';

    for (const operand of middle) {
      operand.setRequiresRepeatableExpression({ parens: true, ref: 'middle' });
    }

    for (const [i, operand] of this.operands.entries()) {
      operand.patch();

      const operator = this.node.operators[i];

      if (operator) {
        const replacement = getCompareOperator(operator.operator, negated);

        if (operator.operator !== replacement) {
          this.overwrite(operator.token.start, operator.token.end, replacement);
        }
      }
    }

    for (const operand of middle) {
      // `a < b < c` → `a < b && b < c`
      //                     ^^^^^
      this.insert(operand.outerEnd, ` ${logicalOperator} ${operand.getRepeatCode()}`);
    }

    if (addParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  /**
   * If any negation is unsafe, just wrap the whole thing in parens with a !
   * operator. That's easier and arguably nicer-looking than trying to
   * intelligently negate the subexpressions accounting for unsafe negations.
   */
  shouldNegateEntireExpression(): boolean {
    return (
      this.negated &&
      this.node.operators.some((operator) => isCompareOpNegationUnsafe(operator.operator)) &&
      !this.options.looseComparisonNegation
    );
  }

  /**
   * @private
   */
  getMiddleOperands(): Array<NodePatcher> {
    return this.operands.slice(1, -1);
  }

  negate(): void {
    this.negated = !this.negated;
  }

  /**
   * Forward the request to the first operand.
   */
  statementNeedsParens(): boolean {
    return this.operands[0].statementShouldAddParens();
  }
}
