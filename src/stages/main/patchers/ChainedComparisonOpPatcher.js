import BinaryOpPatcher from './BinaryOpPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

/**
 * Handles constructs of the form `a < b < c < … < z`.
 */
export default class ChainedComparisonOpPatcher extends NodePatcher {
  expression: NodePatcher;
  
  /**
   * `node` should have type `ChainedComparisonOp`.
   */
  constructor(patcherContext: PatcherContext, expression: BinaryOpPatcher) {
    super(patcherContext);
    this.expression = expression;
    this.negated = false;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.expression.patch();
    this.getMiddleOperands().forEach(middle => {
      let middleAgain = middle.makeRepeatable({ parens: true, ref: 'middle' });
      // `a < b < c` → `a < b && b < c`
      //                     ^^^^^
      this.insert(
        middle.outerEnd,
        ` ${this.negated ? '||' : '&&'} ${middleAgain}`
      );
    });
  }

  /**
   * @private
   */
  getMiddleOperands(): Array<NodePatcher> {
    let result = [];
    let comparison = this.expression.left;
    while (comparison instanceof BinaryOpPatcher) {
      result.unshift(comparison.right);
      comparison = comparison.left;
    }
    return result;
  }

  negate() {
    this.negated = !this.negated;
    let comparison = this.expression;
    while (comparison instanceof BinaryOpPatcher) {
      comparison.negate();
      comparison = comparison.left;
    }
  }

  /**
   * Forward the request to the underlying comparison operator.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementNeedsParens();
  }
}
