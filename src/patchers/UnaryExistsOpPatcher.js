import UnaryOpPatcher from './UnaryOpPatcher.js';
import type { Node, ParseContext, Editor, NodePatcher } from './types.js';

export default class UnaryExistsOpPatcher extends UnaryOpPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor, expression);
    this.negated = false;
  }

  patchAsExpression() {
    let needsParens = !this.isSurroundedByParentheses();
    if (needsParens) {
      // `a or a?` → `a or (a?`
      //       ^           ^
      this.insertBefore('(');
    }
    this.patchAsStatement();
    if (needsParens) {
      // `a or (a?` → `a or (a?)`
      //         ^             ^
      this.insertAfter(')');
    }
  }

  patchAsStatement() {
    let { node, negated } = this;
    let nodeExpression = node.expression;

    if (nodeExpression && nodeExpression.type === 'Identifier') {
      if (negated) {
        // `a?` → `typeof a === 'undefined' && a === null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(this.start, this.end, `typeof ${nodeExpression.raw} === 'undefined' || ${nodeExpression.raw} === null`);
      } else {
        // `a?` → `typeof a !== 'undefined' && a !== null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(this.start, this.end, `typeof ${nodeExpression.raw} !== 'undefined' && ${nodeExpression.raw} !== null`);
      }

    } else {
      if (negated) {
        // `a.b?` → `a.b == null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.after, this.end, ' == null');
      } else {
        // `a.b?` → `a.b != null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.after, this.end, ' != null');
      }
    }
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate() {
    this.negated = !this.negated;
  }
}
