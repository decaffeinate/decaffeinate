import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import BinaryOpPatcher from './BinaryOpPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import StringPatcher from './StringPatcher';
import type NodePatcher from './../../../patchers/NodePatcher';
import type { SourceToken, PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

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
    return (token: SourceToken) => token.type === SourceType.RELATION;
  }

  /**
   * LEFT 'in' RIGHT
   */
  patchAsExpression() {
    // In typical cases, when converting `a in b` to `b.includes(a)`, parens
    // won't be necessary around the `b`, but to be safe, only skip the parens
    // in a specific set of known-good cases.
    let arrayNeedsParens = !(this.right instanceof IdentifierPatcher) &&
        !(this.right instanceof MemberAccessOpPatcher) &&
        !(this.right instanceof DynamicMemberAccessOpPatcher) &&
        !(this.right instanceof FunctionApplicationPatcher) &&
        !(this.right instanceof ArrayInitialiserPatcher) &&
        !(this.right instanceof StringPatcher);

    let rightCode = this.right.patchAndGetCode();
    if (arrayNeedsParens) {
      rightCode = `(${rightCode})`;
    }

    // `a in b` → `a`
    //   ^^^^^
    this.remove(this.left.outerEnd, this.right.outerEnd);

    if (this.negated) {
      // `a` → `!a`
      //        ^
      this.insert(this.left.outerStart, '!');
    }

    // `!a` → `!b.includes(a`
    //          ^^^^^^^^^^^
    this.insert(this.left.outerStart, `${rightCode}.includes(`);

    this.left.patch();

    // `!b.includes(a` → `!b.includes(a)`
    //                                 ^
    this.insert(this.left.outerEnd, ')');
  }

  /**
   * Method invocations don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
