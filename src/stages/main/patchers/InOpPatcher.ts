import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { InOp } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import { FIX_INCLUDES_EVALUATION_ORDER, REMOVE_ARRAY_FROM } from '../../../suggestions';
import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import BinaryOpPatcher from './BinaryOpPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import StringPatcher from './StringPatcher';

const IN_HELPER = `\
function __in__(needle, haystack) {
  return Array.from(haystack).indexOf(needle) >= 0;
}`;

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
    this.negated = (patcherContext.node as InOp).isNot;
  }

  negate(): void {
    this.negated = !this.negated;
  }

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === SourceType.RELATION;
  }

  /**
   * LEFT 'in' RIGHT
   */
  patchAsExpression(): void {
    if (this.options.noArrayIncludes) {
      this.patchAsIndexLookup();
      return;
    }

    if (!this.left.isPure() || !this.right.isPure()) {
      this.patchWithLHSExtracted();
      return;
    }

    let rightCode = this.right.patchAndGetCode();
    if (this.shouldWrapInArrayFrom()) {
      rightCode = `Array.from(${rightCode})`;
    } else if (this.rhsNeedsParens()) {
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

  patchWithLHSExtracted(): void {
    this.addSuggestion(FIX_INCLUDES_EVALUATION_ORDER);
    // `a() in b` → `(needle = a(), in b`
    //               ^^^^^^^^^^^^^^^
    this.insert(this.contentStart, '(');
    let leftRef = this.left.patchRepeatable({ ref: 'needle', forceRepeat: true });
    this.insert(this.left.outerEnd, `, `);

    // `(needle = a(), in b` → `(needle = a(), b`
    //                 ^^^
    this.remove(this.left.outerEnd, this.right.outerStart);

    // `(needle = a(), b` → `(needle = a(), !Array.from(b).includes(needle))`
    //                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    if (this.negated) {
      this.insert(this.right.outerStart, '!');
    }
    let wrapInArrayFrom = this.shouldWrapInArrayFrom();
    let rhsNeedsParens = wrapInArrayFrom || this.rhsNeedsParens();
    if (wrapInArrayFrom) {
      this.insert(this.right.outerStart, 'Array.from');
    }
    if (rhsNeedsParens) {
      this.insert(this.right.outerStart, '(');
    }
    this.right.patch();
    if (rhsNeedsParens) {
      this.insert(this.right.outerEnd, ')');
    }
    this.insert(this.right.outerEnd, `.includes(${leftRef}))`);
  }

  shouldWrapInArrayFrom(): boolean {
    if (this.options.looseIncludes) {
      return false;
    }
    let shouldWrap = !(this.right instanceof ArrayInitialiserPatcher);
    if (shouldWrap) {
      this.addSuggestion(REMOVE_ARRAY_FROM);
    }
    return shouldWrap;
  }

  rhsNeedsParens(): boolean {
    // In typical cases, when converting `a in b` to `b.includes(a)`, parens
    // won't be necessary around the `b`, but to be safe, only skip the parens
    // in a specific set of known-good cases.
    return (
      !(this.right instanceof IdentifierPatcher) &&
      !(this.right instanceof MemberAccessOpPatcher) &&
      !(this.right instanceof DynamicMemberAccessOpPatcher) &&
      !(this.right instanceof FunctionApplicationPatcher) &&
      !(this.right instanceof ArrayInitialiserPatcher) &&
      !(this.right instanceof StringPatcher)
    );
  }

  patchAsIndexLookup(): void {
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
   * Method invocations don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
