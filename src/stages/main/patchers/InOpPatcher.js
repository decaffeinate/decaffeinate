import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, Editor, Node, ParseContext } from './../../../patchers/types.js';
import { RELATION } from 'coffee-lex';

const IN_HELPER =
`function __in__(needle, haystack) {
  return haystack.indexOf(needle) >= 0;
}`;

/**
 * Handles `in` operators, e.g. `a in b` and `a not in b`.
 */
export default class InOpPatcher extends BinaryOpPatcher {
  negated: boolean;

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

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === RELATION;
  }

  /**
   * LEFT 'in' RIGHT
   */
  patchAsExpression() {
    let helper = this.registerHelper('__in__', IN_HELPER);

    if (this.negated) {
      // `a in b` → `!a in b`
      this.insert(this.left.outerStart, '!');
    }

    // `a in b` → `__in__(a in b`
    //             ^^^^^^^
    this.insert(this.left.outerStart, `${helper}(`);

    this.left.patch();

    // `__in__(a in b` → `__in__(a, b`
    //          ^^^^              ^^
    this.overwrite(this.left.outerEnd, this.right.outerStart, ', ');

    this.right.patch();

    // `__in__(a, b` → `__in__(a, b)`
    //                             ^
    this.insert(this.right.outerEnd, ')');
  }

  /**
   * We always prefix with `__in__` so no parens needed.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
