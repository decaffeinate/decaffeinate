import ArrayInitialiserPatcher from './ArrayInitialiserPatcher.js';
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
    if (this.right instanceof ArrayInitialiserPatcher && this.right.members.length > 0) {
      this.patchAsLogicalOperators(this.right.members);
    } else {
      this.patchAsIndexLookup();
    }
  }

  /**
   * LEFT 'in' '[' ELEMENT, … ']'
   *
   * @private
   */
  patchAsLogicalOperators(elements: Array<NodePatcher>) {
    let comparison = this.negated ? '!==' : '===';
    let operator = this.negated ? '&&' : '||';
    let leftAgain = this.left.makeRepeatable(true);
    this.left.patch();

    // `a in [b, c]` → `a === b, c]`
    //    ^^^^            ^^^^^
    this.overwrite(this.left.outerEnd, elements[0].outerStart, ` ${comparison} `);

    for (let i = 0; i < elements.length - 1; i++) {
      let element = elements[i];
      element.patch({ needsParens: true });

      // `a === b, c]` → `a === b || a === c]`
      //         ^^               ^^^^^^^^^^
      this.overwrite(
        element.outerEnd,
        elements[i + 1].outerStart,
        ` ${operator} ${leftAgain} ${comparison} `
      );
    }

    let lastElement = elements[elements.length - 1];
    lastElement.patch({ needsParens: true });

    // `a === b || a === c]` → `a === b || a === c`
    //                     ^
    this.remove(lastElement.outerEnd, this.right.outerEnd);
  }

  /**
   * LEFT 'in' RIGHT
   *
   * @private
   */
  patchAsIndexLookup() {
    let helper = this.registerHelper('__in__', IN_HELPER);

    if (this.negated) {
      // `a in b` → `!a in b`
      //             ^
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
