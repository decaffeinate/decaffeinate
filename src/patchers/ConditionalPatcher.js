import NodePatcher from './NodePatcher';
import type { Token } from './types';

export default class ConditionalPatcher extends NodePatcher {
  constructor(node, context, editor, condition, consequent, alternate) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patch() {
    let { context, node } = this;
    if (node.isUnless) {
      let unlessToken = context.tokenAtIndex(this.startTokenIndex);
      this.overwrite(...unlessToken.range, 'if');
    }
    this.patchCondition();
    this.patchConsequent();
    this.patchAlternate();
  }

  /**
   * @private
   */
  patchCondition() {
    let { node, condition } = this;
    let conditionHasParentheses = condition.isSurroundedByParentheses();
    if (!conditionHasParentheses) {
      condition.insertBefore('(');
    }
    if (node.isUnless) {
      condition.negate();
    }
    condition.patch();
    if (!conditionHasParentheses) {
      condition.insertAfter(')');
    }
  }

  /**
   * @private
   */
  patchConsequent() {
    let { condition, consequent, alternate } = this;
    let leftBracePosition = condition.after;

    if (alternate) {
      let elseToken = this.getElseToken();
      let [ rightBracePosition ] = elseToken.range;
      consequent.patch({ leftBracePosition, rightBracePosition });
    } else {
      consequent.patch({ leftBracePosition });
    }
  }

  /**
   * @private
   */
  patchAlternate() {
    let { alternate } = this;
    if (alternate) {
      let elseToken = this.getElseToken();
      let [ , leftBracePosition ] = elseToken.range;
      alternate.patch({ leftBracePosition });
    }
  }

  /**
   * Conditionals do not need semicolons when used as statements.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }

  /**
   * Gets the token representing the `else` between consequent and alternate.
   *
   * @private
   */
  getElseToken(): ?Token {
    let { consequent, alternate } = this;
    if (!alternate) {
      return null;
    }

    let elseToken = this.tokenBetweenPatchersMatching(consequent, alternate, 'ELSE');
    if (!elseToken) {
      throw new Error(
        `BUG: expected ELSE token between condition and consequent in ${this.node.type}`
      );
    }
    return elseToken;
  }
}
