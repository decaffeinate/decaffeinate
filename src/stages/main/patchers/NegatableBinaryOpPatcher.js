import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';

/**
 * Handles `instanceof` operator, e.g. `a instanceof b`.
 */
export default class NegatableBinaryOpPatcher extends BinaryOpPatcher {
  negated: boolean;
  
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor, left, right);
    this.negated = node.isNot;
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
    let needsParens = negated && !this.isSurroundedByParentheses();

    if (negated) {
      // `a not instanceof b` → `!a not instanceof b`
      //                         ^
      this.insert(this.outerStart, '!');
    }

    if (needsParens) {
      // `!a not instanceof b` → `!(a not instanceof b`
      //                           ^
      this.insert(this.contentStart, '(');
    }

    // Patch LEFT and RIGHT.
    super.patchAsExpression();

    if (needsParens) {
      // `!(a not instanceof b` → `!(a not instanceof b)`
      //                                               ^
      this.insert(this.contentEnd, ')');
    }

    // `!(a not instanceof b)` → `!(a instanceof b)`
    //      ^^^^^^^^^^^^^^            ^^^^^^^^^^
    let token = this.getOperatorToken();
    this.overwrite(token.start, token.end, this.javaScriptOperator());
  }

  /**
   * This is here so we can add the `!` outside any existing parens.
   */
  allowPatchingOuterBounds(): boolean {
    return true;
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
