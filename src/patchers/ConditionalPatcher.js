import NodePatcher from './NodePatcher';
import type BlockPatcher from './BlockPatcher';
import type { Node, Token, ParseContext, Editor } from './types';

export default class ConditionalPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, consequent: BlockPatcher, alternate: ?BlockPatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
    condition.setRequiresExpression();
  }

  prefersToPatchAsExpression(): boolean {
    let { consequent, alternate } = this;
    if (!alternate) {
      return false;
    }
    return (
      consequent.prefersToPatchAsExpression() &&
      alternate.prefersToPatchAsExpression()
    );
  }

  setExpression(force=false): boolean {
    let willPatchAsExpression = super.setExpression(force);
    if (willPatchAsExpression && this.willPatchAsTernary()) {
      this.consequent.setRequiresExpression();
      if (this.alternate) {
        this.alternate.setRequiresExpression();
      }
    }
  }

  /**
   * @private
   */
  willPatchAsTernary(): boolean {
    return (
      this.prefersToPatchAsExpression() || (
        this.forcedToPatchAsExpression() &&
        this.consequent.prefersToPatchAsExpression()
      )
    );
  }

  /**
   * @private
   */
  willPatchAsIIFE(): boolean {
    return !this.willPatchAsTernary() && this.forcedToPatchAsExpression();
  }

  patchAsExpression() {
    // `if a then b` → `a then b`
    //  ^^^
    this.remove(this.start, this.condition.start);

    this.condition.patch();

    let thenToken = this.getThenToken();
    if (thenToken) {
      // `a then b` → `a ? b`
      let [ start, end ] = thenToken.range;
      this.overwrite(start, end, '?');
    } else {
      // `a b` → `a ? b`
      this.insert(this.condition.after, ' ?');
    }

    this.consequent.patch();

    let { alternate } = this;
    if (alternate) {
      // `a ? b else c` → `a ? b : c`
      let elseToken = this.getElseToken();
      let [ start, end ] = elseToken.range;
      this.overwrite(start, end, ':');
      alternate.patch();
    } else {
      // `a ? b` → `a ? b : undefined`
      this.insert(this.consequent.after, ' : undefined');
    }
  }

  patchAsForcedExpression() {
    if (this.willPatchAsTernary()) {
      // We didn't want to be an expression because we don't have an alternate,
      // which means that the alternate of a generated ternary would be
      // `undefined`, which is ugly (i.e. `if a then b` → `a ? b : undefined`).
      // TODO: Generate a `do` expression instead? (i.e. `do { if (a) { b; } }`)
      this.patchAsExpression();
    }

    // TODO: IIFE
  }

  patchAsStatement() {
    this.patchConditionForStatement();
    this.patchConsequentForStatement();
    this.patchAlternateForStatement();
  }

  /**
   * @private
   */
  patchConditionForStatement() {
    let { context, node, condition } = this;

    if (node.isUnless) {
      // `unless a` → `if a`
      //  ^^^^^^        ^^
      let unlessToken = context.tokenAtIndex(this.startTokenIndex);
      this.overwrite(...unlessToken.range, 'if');
    }
    let conditionHasParentheses = condition.isSurroundedByParentheses();
    if (!conditionHasParentheses) {
      // `if a` → `if (a`
      //               ^
      this.insert(condition.before, '(');
    }
    if (node.isUnless) {
      condition.negate();
    }
    condition.patch();
    if (!conditionHasParentheses) {
      // `if (a` → `if (a)`
      //                  ^
      this.insert(condition.after, ')');
    }

    let thenToken = this.getThenToken();
    if (thenToken) {
      // `if (a) then b` → `if (a) b`
      //         ^^^^^
      let [ start, end ] = thenToken.range;
      this.remove(start, end + ' '.length);
    }
  }

  /**
   * @private
   */
  patchConsequentForStatement() {
    let { condition, consequent, alternate } = this;
    this.insert(condition.after, ' {');

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
  patchAlternateForStatement() {
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

  setImplicitlyReturns() {
    let { consequent, alternate } = this;
    consequent.setImplicitlyReturns();
    if (alternate) {
      alternate.setImplicitlyReturns();
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
