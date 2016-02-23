import BinaryOpPatcher from './BinaryOpPatcher';
import type NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class InstanceofOpPatcher extends BinaryOpPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor, left, right);
    this.negated = node.isNot;
  }

  negate() {
    this.negated = !this.negated;
  }

  /**
   * LEFT ( 'instanceof' | 'not instanceof' ) RIGHT
   */
  patchAsExpression() {
    let { negated } = this;
    let needsParens = negated && !this.isSurroundedByParentheses();

    if (negated) {
      // `a not instanceof b` → `!a not instanceof b`
      //                         ^
      this.insertBefore('!');
    }

    if (needsParens) {
      // `!a not instanceof b` → `!(a not instanceof b`
      //                           ^
      this.insertBefore('(');
    }

    // Patch LEFT and RIGHT.
    super.patchAsExpression();

    if (needsParens) {
      // `!(a not instanceof b` → `!(a not instanceof b)`
      //                                               ^
      this.insertAfter(')');
    }

    // `!(a not instanceof b)` → `!(a instanceof b)`
    //      ^^^^^^^^^^^^^^            ^^^^^^^^^^
    this.overwrite(...this.getOperatorToken().range, 'instanceof');
  }
}
