import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './NodePatcher.js';
import type { Editor, Node, ParseContext } from './types.js';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class NegatableBinaryOpPatcher extends BinaryOpPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor, left, right);
    this.negated = node.isNot;
  }

  negate() {
    this.negated = !this.negated;
  }

  /**
   * @protected
   */
  javaScriptOperator() {
    throw new Error(`'javaScriptOperator' should be implemented in subclass`);
  }

  /**
   * LEFT 'not'? OP RIGHT
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
    let token = this.getOperatorToken();
    this.overwrite(...token.range, this.javaScriptOperator());
  }
}
