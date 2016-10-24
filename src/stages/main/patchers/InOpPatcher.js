import ArrayInitialiserPatcher from './ArrayInitialiserPatcher.js';
import BinaryOpPatcher from './BinaryOpPatcher.js';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher.js';
import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';
import HerestringPatcher from './HerestringPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import StringPatcher from './StringPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, Editor, Node, ParseContext } from './../../../patchers/types.js';
import { RELATION } from 'coffee-lex';

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
    // In typical cases, when converting `a in b` to `b.includes(a)`, parens
    // won't be necessary around the `b`, but to be safe, only skip the parens
    // in a specific set of known-good cases.
    let arrayNeedsParens = !this.right.isSurroundedByParentheses() &&
        !(this.right instanceof IdentifierPatcher) &&
        !(this.right instanceof MemberAccessOpPatcher) &&
        !(this.right instanceof DynamicMemberAccessOpPatcher) &&
        !(this.right instanceof FunctionApplicationPatcher) &&
        !(this.right instanceof ArrayInitialiserPatcher) &&
        !(this.right instanceof StringPatcher) &&
        !(this.right instanceof HerestringPatcher);

    this.left.patch();
    let leftCode = this.slice(this.left.contentStart, this.left.contentEnd);

    // `a in b` → `b`
    //  ^^^^^
    this.remove(this.left.outerStart, this.right.outerStart);

    if (this.negated) {
      // `b` → `!b`
      //        ^
      this.insert(this.right.outerStart, '!');
    }
    if (arrayNeedsParens) {
      // `!b` → `!(b`
      //          ^
      this.insert(this.right.outerStart, '(');
    }

    this.right.patch();

    if (arrayNeedsParens) {
      // `!(b` → `!(b)`
      //             ^
      this.insert(this.right.outerEnd, ')');
    }

    // `!(b` → `!(b).includes(a)`
    //              ^^^^^^^^^^^^
    this.insert(this.right.outerEnd, `.includes(${leftCode})`);
  }

  /**
   * Method invocations don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
