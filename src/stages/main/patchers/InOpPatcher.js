import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';

const IN_HELPER =
`function __in__(needle, haystack) {
  return haystack.indexOf(needle) >= 0;
}`;

/**
 * Handles `in` operators, e.g. `a in b` and `a not in b`.
 */
export default class InOpPatcher extends BinaryOpPatcher {
  /**
   * `node` is of type `InOp`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor, left, right);
    this.negated = node.isNot;
  }

  negate() {
    this.negated = !this.negated;
  }

  /**
   * LEFT 'in' RIGHT
   */
  patchAsExpression() {
    let needsParens = !this.isSurroundedByParentheses();
    let helper = this.registerHelper('__in__', IN_HELPER);

    if (this.negated) {
      // `a in b` → `!a in b`
      this.insert(this.left.before, '!');
    }

    // `a in b` → `__in__a in b`
    //             ^^^^^^^
    this.insert(this.left.before, helper);

    if (needsParens) {
      // `__in__a in b` → `__in__(a in b`
      //                         ^
      this.insert(this.left.before, '(');
    }

    this.left.patch();

    // `__in__(a in b` → `__in__(a, b`
    //          ^^^^              ^^
    this.overwrite(this.left.after, this.right.before, ', ');

    this.right.patch();

    if (needsParens) {
      // `__in__(a, b` → `__in__(a, b)`
      //                             ^
      this.insert(this.right.after, ')');
    }
  }
}
