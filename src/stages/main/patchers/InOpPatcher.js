import ArrayInitialiserPatcher from './ArrayInitialiserPatcher.js';
import BinaryOpPatcher from './BinaryOpPatcher.js';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher.js';
import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import StringPatcher from './StringPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, PatcherContext } from './../../../patchers/types.js';
import { RELATION } from 'coffee-lex';

/**
 * Handles `in` operators, e.g. `a in b` and `a not in b`.
 */
export default class InOpPatcher extends BinaryOpPatcher {
  negated: boolean;

  /**
   * `node` is of type `InOp`.
   */
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext, left, right);
    this.negated = patcherContext.node.isNot;
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
    // In typical cases, when converting `a in b` to `b.includes(a)`, parens
    // won't be necessary around the `b`, but to be safe, only skip the parens
    // in a specific set of known-good cases.
    let arrayNeedsParens = !this.right.isSurroundedByParentheses() &&
        !(this.right instanceof IdentifierPatcher) &&
        !(this.right instanceof MemberAccessOpPatcher) &&
        !(this.right instanceof DynamicMemberAccessOpPatcher) &&
        !(this.right instanceof FunctionApplicationPatcher) &&
        !(this.right instanceof ArrayInitialiserPatcher) &&
        !(this.right instanceof StringPatcher);

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
