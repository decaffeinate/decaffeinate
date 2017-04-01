import { SourceType } from 'coffee-lex';
import type { SourceTokenListIndex } from 'coffee-lex';

import NodePatcher from '../../../patchers/NodePatcher';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import postfixNodeNeedsOuterParens from '../../../utils/postfixNodeNeedsOuterParens';
import type { PatcherContext } from './../../../patchers/types';

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
  consequent: ?NodePatcher;
  alternate: ?NodePatcher;

  constructor(patcherContext: PatcherContext, condition: NodePatcher, consequent: NodePatcher, alternate: ?NodePatcher) {
    super(patcherContext);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patchAsExpression() {
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
  patchPostIf() {
    this.condition.patch();
    if (postfixExpressionRequiresParens(this.slice(this.condition.contentStart, this.condition.contentEnd)) &&
        !this.condition.isSurroundedByParentheses()) {
      this.condition.surroundInParens();
    }

    let ifTokenIndex = this.getIfTokenIndex();
    let ifToken = this.sourceTokenAtIndex(ifTokenIndex);
    if (!ifToken) {
      throw this.error('Unable to find `if` token.');
    }

    let needsParens = postfixNodeNeedsOuterParens(this);
    let ifAndConditionCode = this.slice(ifToken.start, this.condition.outerEnd);
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
    return this.consequent !== null
      && this.condition.contentStart > this.consequent.contentStart;
  }

  getIfTokenIndex(): SourceTokenListIndex {
    let start = this.contentStartTokenIndex;
    let index = this.condition.outerStartTokenIndex;

    while (index !== start) {
      let token = this.sourceTokenAtIndex(index);
      if (token && token.type === SourceType.IF) {
        break;
      }
      index = index.previous();
    }

    if (!index) {
      throw this.error('unable to find `if` token in conditional');
    }

    return index;
  }
}
