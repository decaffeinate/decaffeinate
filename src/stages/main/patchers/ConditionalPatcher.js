import NodePatcher from './../../../patchers/NodePatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Node, SourceTokenListIndex, ParseContext, Editor } from './../../../patchers/types.js';
import { ELSE, IF, THEN } from 'coffee-lex';

export default class ConditionalPatcher extends NodePatcher {
  condition: NodePatcher;
  consequent: BlockPatcher;
  alternate: ?BlockPatcher;

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
    if (!consequent || !alternate) {
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
      if (this.consequent) {
        this.consequent.setRequiresExpression();
      }
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
        (!this.consequent || this.consequent.prefersToPatchAsExpression()) &&
        (!this.alternate || this.alternate.prefersToPatchAsExpression())
      )
    );
  }

  /**
   * @private
   */
  willPatchAsIIFE(): boolean {
    return !this.willPatchAsTernary() && this.forcedToPatchAsExpression();
  }

  patchAsExpression({ needsParens }={}) {
    let addParens = needsParens && !this.isSurroundedByParentheses();

    // `if a then b` → `a then b`
    //  ^^^
    this.overwrite(
      this.contentStart,
      this.condition.outerStart,
      addParens ? '(' : ''
    );

    if (this.node.isUnless) {
      this.condition.negate();
    }

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

    let elseTokenIndex = this.getElseSourceTokenIndex();
    let elseToken = elseTokenIndex && this.sourceTokenAtIndex(elseTokenIndex);

    let { consequent, alternate } = this;
    if (consequent && alternate) {
      consequent.patch();
      // `a ? b else c` → `a ? b : c`
      this.overwrite(elseToken.start, elseToken.end, ':');
      alternate.patch();
    } else if (consequent && !alternate) {
      consequent.patch();
      // `a ? b` → `a ? b : undefined`
      if (elseToken !== null) {
        this.overwrite(this.consequent.outerEnd, elseToken.end, ' : undefined');
      } else {
        this.insert(this.consequent.outerEnd, ' : undefined');
      }
    } else if (alternate) {
      this.overwrite(elseToken.start, elseToken.end, 'undefined :');
      alternate.patch();
    }

    if (addParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  patchAsForcedExpression() {
    if (this.willPatchAsTernary()) {
      // We didn't want to be an expression because we don't have an alternate,
      // which means that the alternate of a generated ternary would be
      // `undefined`, which is ugly (i.e. `if a then b` → `a ? b : undefined`).
      // TODO: Generate a `do` expression instead? (i.e. `do { if (a) { b; } }`)
      this.patchAsExpression();
    } else if (this.willPatchAsIIFE()) {
      this.patchAsIIFE();
    }
  }

  patchAsIIFE() {
    // We're only patched as an expression due to a parent instructing us to,
    // and the indent level is more logically the indent level of our parent.
    let baseIndent = this.parent.getIndent(0);
    let conditionIndent = this.parent.getIndent(1);
    if (this.consequent) {
      this.consequent.setShouldPatchInline(false);
      this.consequent.setImplicitlyReturns();
    }
    if (this.alternate) {
      this.alternate.setShouldPatchInline(false);
      this.alternate.setImplicitlyReturns();
    }
    this.insert(this.innerStart, `(() => {\n${conditionIndent}`);
    this.patchAsStatement();
    this.insert(this.innerEnd, `\n${baseIndent}})()`);
  }

  canHandleImplicitReturn(): boolean {
    return this.willPatchAsIIFE();
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
    this.condition.patch({ needsParens: false });
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
      if (this.consequent !== null) {
        this.consequent.patch({ leftBrace: false, rightBrace: false });
      }
      this.insert(rightBracePosition, '} ');
    } else {
      if (this.consequent !== null) {
        this.consequent.patch({ leftBrace: false });
      }
    }
  }

  /**
   * @private
   */
  patchAlternateForStatement() {
    let elseTokenIndex = this.getElseSourceTokenIndex();
    if (this.alternate) {
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
    } else if (elseTokenIndex !== null) {
      let elseToken = this.sourceTokenAtIndex(elseTokenIndex);
      this.insert(elseToken.end, ' {}');
    }
  }

  setImplicitlyReturns() {
    if (this.consequent) {
      this.consequent.setImplicitlyReturns();
    }
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
    let elseTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.consequent !== null ? this.consequent.outerEnd : this.condition.outerEnd,
      this.alternate !== null ? this.alternate.outerStart : this.outerEnd,
      token => token.type === ELSE
    );
    if (this.alternate !== null && !elseTokenIndex) {
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
    if (this.consequent === null) {
      return null;
    }
    return this.indexOfSourceTokenBetweenPatchersMatching(
      this.condition,
      this.consequent,
      token => token.type === THEN
    );
  }

  /**
   * Conditionals have all code paths if there is an `else` and both the
   * consequent and alternate have all their code paths.
   */
  allCodePathsPresent(): boolean {
    if (!this.consequent || !this.alternate) {
      return false;
    }

    return (
      this.consequent.allCodePathsPresent() &&
      this.alternate.allCodePathsPresent()
    );
  }
}
