import { InstanceofOp, OfOp } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import BinaryOpPatcher from './BinaryOpPatcher';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class NegatableBinaryOpPatcher extends BinaryOpPatcher {
  negated: boolean;
  
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext, left, right);
    this.negated = (patcherContext.node as OfOp | InstanceofOp).isNot;
  }

  negate(): void {
    this.negated = !this.negated;
  }

  javaScriptOperator(): string {
    throw new Error(`'javaScriptOperator' should be implemented in subclass`);
  }

  /**
   * LEFT 'not'? OP RIGHT
   */
  patchAsExpression(): void {
    let { negated } = this;
    if (negated) {
      // `a not instanceof b` → `!(a not instanceof b`
      //                         ^^
      this.insert(this.innerStart, '!(');
    }

    // Patch LEFT and RIGHT.
    super.patchAsExpression();

    if (negated) {
      // `!(a not instanceof b` → `!(a not instanceof b)`
      //                                               ^
      this.insert(this.innerEnd, ')');
    }

    // `!(a not instanceof b)` → `!(a instanceof b)`
    //      ^^^^^^^^^^^^^^            ^^^^^^^^^^
    let token = this.getOperatorToken();
    this.overwrite(token.start, token.end, this.javaScriptOperator());
  }

  /**
   * It may be wrapped due to negation, so don't double-wrap.
   */
  statementNeedsParens(): boolean {
    if (this.negated) {
      return false;
    } else {
      return super.statementNeedsParens();
    }
  }
}
