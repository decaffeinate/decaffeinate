import BinaryOpPatcher from './BinaryOpPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import UnaryOpPatcher from './UnaryOpPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Node, SourceTokenListIndex, ParseContext, Editor } from './../../../patchers/types.js';
import { ELSE, IF, THEN } from 'coffee-lex';

export default class ConditionalPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, consequent: BlockPatcher, alternate: ?BlockPatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  initialize() {
    this.condition.setRequiresExpression();
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
    let addParens = this.ternaryNeedsParens() && !this.isSurroundedByParentheses();

    // `if a then b` → `a then b`
    //  ^^^
    this.overwrite(
      this.contentStart,
      this.condition.contentStart,
      addParens ? '(' : ''
    );

    this.condition.patch();

    let thenTokenIndex = this.getThenTokenIndex();
    if (thenTokenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenTokenIndex);
      // `a then b` → `a ? b`
      //    ^^^^         ^
      this.overwrite(thenToken.start, thenToken.end, '?');
    } else {
      // `a b` → `a ? b`
      //           ^^
      this.insert(this.condition.outerEnd, ' ?');
    }

    this.consequent.patch();

    let { alternate } = this;
    if (alternate) {
      // `a ? b else c` → `a ? b : c`
      let elseTokenIndex = this.getElseSourceTokenIndex();
      let elseToken = this.sourceTokenAtIndex(elseTokenIndex);
      this.overwrite(elseToken.start, elseToken.end, ':');
      alternate.patch();
    } else {
      // `a ? b` → `a ? b : undefined`
      this.insert(this.consequent.outerEnd, ' : undefined');
    }

    if (addParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  ternaryNeedsParens(): boolean {
    return (
      this.parent instanceof BinaryOpPatcher ||
      this.parent instanceof UnaryOpPatcher
    );
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
    // `unless a` → `if a`
    //  ^^^^^^        ^^
    let ifToken = this.sourceTokenAtIndex(this.getIfSourceTokenIndex());
    this.overwrite(ifToken.start, ifToken.end, 'if');

    let conditionHasParentheses = this.condition.isSurroundedByParentheses();
    if (!conditionHasParentheses) {
      // `if a` → `if (a`
      //              ^
      this.insert(this.condition.outerStart, '(');
    }
    if (this.node.isUnless) {
      this.condition.negate();
    }
    this.condition.patch();
    if (!conditionHasParentheses) {
      // `if (a` → `if (a)`
      //                  ^
      this.insert(this.condition.outerEnd, ')');
    }

    let thenTokenIndex = this.getThenTokenIndex();
    if (thenTokenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenTokenIndex);
      // `if (a) then b` → `if (a) b`
      //         ^^^^^
      this.remove(thenToken.start, this.consequent.outerStart);
    }
  }

  /**
   * @private
   */
  patchConsequentForStatement() {
    this.insert(this.condition.outerEnd, ' {');

    if (this.alternate) {
      let elseTokenIndex = this.getElseSourceTokenIndex();
      let elseToken = this.sourceTokenAtIndex(elseTokenIndex);
      let rightBracePosition = elseToken.start;
      this.insert(rightBracePosition, '} ');
      this.consequent.patch({ leftBrace: false, rightBrace: false });
    } else {
      this.consequent.patch({ leftBrace: false });
    }
  }

  /**
   * @private
   */
  patchAlternateForStatement() {
    if (this.alternate) {
      let elseTokenIndex = this.getElseSourceTokenIndex();
      let ifToken = this.sourceTokenAtIndex(elseTokenIndex.next());
      let isElseIf = ifToken ? ifToken.type === IF : false;
      if (isElseIf) {
        // Let the nested ConditionalPatcher handle braces.
        this.alternate.patch({ leftBrace: false, rightBrace: false });
      } else {
        let elseToken = this.sourceTokenAtIndex(elseTokenIndex);
        let leftBracePosition = elseToken.end;
        this.insert(leftBracePosition, ' {');
        this.alternate.patch({ leftBrace: false });
      }
    }
  }

  setImplicitlyReturns() {
    this.consequent.setImplicitlyReturns();
    if (this.alternate) {
      this.alternate.setImplicitlyReturns();
    }
  }

  /**
   * Conditionals do not need semicolons when used as statements.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }

  /**
   * Gets the index of the token representing the `if` at the start.
   *
   * @private
   */
  getIfSourceTokenIndex(): SourceTokenListIndex {
    let ifTokenIndex = this.indexOfSourceTokenStartingAtSourceIndex(this.contentStart);
    if (!ifTokenIndex) {
      throw this.error('expected IF token at start of conditional');
    }
    let ifToken = this.sourceTokenAtIndex(ifTokenIndex);
    if (ifToken.type !== IF) {
      throw this.error(
        `expected IF token at start of conditional, but got ${ifToken.type.name}`
      );
    }
    return ifTokenIndex;
  }
  /**
   * Gets the index of the token representing the `else` between consequent and
   * alternate.
   *
   * @private
   */
  getElseSourceTokenIndex(): ?SourceTokenListIndex {
    if (!this.alternate) {
      return null;
    }

    let elseTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.consequent,
      this.alternate,
      token => token.type === ELSE
    );
    if (!elseTokenIndex) {
      throw this.error(
        'expected ELSE token between consequent and alternate',
        this.consequent.outerEnd,
        this.alternate.outerStart
      );
    }
    return elseTokenIndex;
  }

  /**
   * Gets the index of the token representing the `then` between condition and
   * consequent.
   *
   * @private
   */
  getThenTokenIndex(): ?SourceTokenListIndex {
    return this.indexOfSourceTokenBetweenPatchersMatching(
      this.condition,
      this.consequent,
      token => token.type === THEN
    );
  }
}
