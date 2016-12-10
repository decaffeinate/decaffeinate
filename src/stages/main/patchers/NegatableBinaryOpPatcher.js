import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class NegatableBinaryOpPatcher extends BinaryOpPatcher {
  negated: boolean;
  
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext, left, right);
    this.negated = patcherContext.node.isNot;
  }

  negate() {
    this.negated = !this.negated;
  }

  javaScriptOperator() {
    throw new Error(`'javaScriptOperator' should be implemented in subclass`);
  }

  /**
   * LEFT 'not'? OP RIGHT
   */
  patchAsExpression() {
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
