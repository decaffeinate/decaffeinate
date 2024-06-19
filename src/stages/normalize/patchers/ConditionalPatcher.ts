import { SourceType, SourceTokenListIndex } from 'coffee-lex';

import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import postfixNodeNeedsOuterParens from '../../../utils/postfixNodeNeedsOuterParens';

/**
 * Normalizes conditionals by rewriting post-`if` into standard `if`, e.g.
 *
 *   return [] unless list?
 *
 * becomes
 *
 *   unless list? then return []
 */
export default class ConditionalPatcher extends NodePatcher {
  condition: NodePatcher;
  consequent: NodePatcher | null;
  alternate: NodePatcher | null;

  constructor(
    patcherContext: PatcherContext,
    condition: NodePatcher,
    consequent: NodePatcher,
    alternate: NodePatcher | null,
  ) {
    super(patcherContext);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patchAsExpression(): void {
    if (this.isPostIf()) {
      this.patchPostIf();
    } else {
      this.condition.patch();
      if (this.consequent !== null) {
        this.consequent.patch();
      }
      if (this.alternate !== null) {
        this.alternate.patch();
      }
    }
  }

  /**
   * `CONSEQUENT 'if' CONDITION` → `if CONDITION then CONSEQUENT`
   * `CONSEQUENT 'unless' CONDITION` → `unless CONDITION then CONSEQUENT`
   */
  patchPostIf(): void {
    if (!this.consequent) {
      throw this.error('Expected non-null consequent for post-if.');
    }
    this.condition.patch();
    if (
      postfixExpressionRequiresParens(this.slice(this.condition.contentStart, this.condition.contentEnd)) &&
      !this.condition.isSurroundedByParentheses()
    ) {
      this.condition.surroundInParens();
    }

    const ifTokenIndex = this.getIfTokenIndex();
    const ifToken = this.sourceTokenAtIndex(ifTokenIndex);
    if (!ifToken) {
      throw this.error('Unable to find `if` token.');
    }

    const needsParens = postfixNodeNeedsOuterParens(this);
    const ifAndConditionCode = this.slice(ifToken.start, this.condition.outerEnd);
    if (needsParens) {
      this.insert(this.consequent.outerStart, '(');
    }
    this.insert(this.consequent.outerStart, `${ifAndConditionCode} then `);
    this.consequent.patch();
    if (needsParens) {
      this.insert(this.consequent.outerEnd, ')');
    }
    this.remove(this.consequent.outerEnd, this.contentEnd);
  }

  isPostIf(): boolean {
    return this.consequent !== null && this.condition.contentStart > this.consequent.contentStart;
  }

  getIfTokenIndex(): SourceTokenListIndex {
    const start = this.contentStartTokenIndex;
    let index = this.condition.outerStartTokenIndex;

    while (index !== start) {
      const token = this.sourceTokenAtIndex(index);
      if (token && token.type === SourceType.IF) {
        break;
      }
      index = notNull(index.previous());
    }

    if (!index) {
      throw this.error('unable to find `if` token in conditional');
    }

    return index;
  }
}
