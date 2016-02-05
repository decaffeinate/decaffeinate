import NodePatcher from './NodePatcher';
import type BlockPatcher from './BlockPatcher';
import type { Node, Token, ParseContext, Editor } from './types';

export default class ConditionalPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, consequent: BlockPatcher, alternate: ?BlockPatcher) {
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

    let thenToken = this.getThenToken();
    if (thenToken) {
      let [ start, end ] = thenToken.range;
      this.remove(start, end + ' '.length);
    }
  }

  /**
   * @private
   */
  patchConsequent() {
    let { condition, consequent, alternate } = this;
    condition.insertAfter(' {');

    if (alternate) {
      let elseToken = this.getElseToken();
      let [ rightBracePosition ] = elseToken.range;
      this.insert(rightBracePosition, '} ');
      consequent.patch({ leftBrace: false, rightBrace: false });
    } else {
      consequent.patch({ leftBrace: false });
    }
  }

  /**
   * @private
   */
  patchAlternate() {
    let { alternate } = this;
    if (alternate) {
      let elseToken = this.getElseToken();
      let isElseIf = this.hasTokenAfterToken(elseToken, 'IF');
      if (isElseIf) {
        // Let the nested ConditionalPatcher handle braces.
        alternate.patch({ leftBrace: false, rightBrace: false });
      } else {
        let [ , leftBracePosition ] = elseToken.range;
        this.insert(leftBracePosition, ' {');
        alternate.patch({ leftBrace: false });
      }
    }
  }

  return() {
    let { consequent, alternate } = this;
    consequent.return();
    if (alternate) {
      alternate.return();
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
  getElseToken(): Token {
    let { consequent, alternate } = this;
    if (!alternate) {
      return null;
    }

    let elseToken = this.tokenBetweenPatchersMatching(consequent, alternate, 'ELSE');
    if (!elseToken) {
      throw this.error(
        'expected ELSE token between consequent and alternate',
        consequent.after,
        alternate.before
      );
    }
    return elseToken;
  }

  /**
   * Gets the token representing the `then` between condition and consequent.
   *
   * @private
   */
  getThenToken(): ?Token {
    let { condition, consequent } = this;
    return this.tokenBetweenPatchersMatching(condition, consequent, 'THEN');
  }
}
