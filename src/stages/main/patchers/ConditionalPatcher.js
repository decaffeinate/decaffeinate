import NodePatcher from './../../../patchers/NodePatcher';
import type BlockPatcher from './BlockPatcher';
import type { PatcherContext, SourceTokenListIndex } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class ConditionalPatcher extends NodePatcher {
  condition: NodePatcher;
  consequent: ?BlockPatcher;
  alternate: ?BlockPatcher;

  negated: boolean = false;

  constructor(patcherContext: PatcherContext, condition: NodePatcher, consequent: BlockPatcher, alternate: ?BlockPatcher) {
    super(patcherContext);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  initialize() {
    this.condition.setRequiresExpression();
  }

  /**
   * Anything like `break`, `continue`, or `return` inside a conditional means
   * we can't even safely make it an IIFE.
   */
  canPatchAsExpression(): boolean {
    if (this.consequent && !this.consequent.canPatchAsExpression()) {
      return false;
    }
    if (this.alternate && !this.alternate.canPatchAsExpression()) {
      return false;
    }
    return true;
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

  negate() {
    this.negated = !this.negated;
  }

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
    let addParens = this.negated ||
      (needsParens && !this.isSurroundedByParentheses());

    // `if a then b` → `a then b`
    //  ^^^
    this.overwrite(
      this.contentStart,
      this.condition.outerStart,
      `${this.negated ? '!' : ''}${addParens ? '(' : ''}`
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
        this.overwrite(elseToken.start, elseToken.end, ' : undefined');
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
    if (this.negated) {
      this.insert(this.innerStart, '!');
    }

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
    this.patchInIIFE(() => {
      this.insert(this.innerStart, `\n${conditionIndent}`);
      this.patchAsStatement();
      this.insert(this.innerEnd, `\n${baseIndent}`);
    });
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
      } else {
        this.insert(this.condition.outerEnd, '} ');
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
      let isElseIf = ifToken ? ifToken.type === SourceType.IF : false;
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
    } else if (super.implicitlyReturns()) {
      let emptyImplicitReturnCode =
        this.implicitReturnPatcher().getEmptyImplicitReturnCode();
      if (emptyImplicitReturnCode) {
        this.insert(this.contentEnd, ' else {\n');
        this.insert(this.contentEnd, `${this.getIndent(1)}${emptyImplicitReturnCode}\n`);
        this.insert(this.contentEnd, `${this.getIndent()}}`);
      }
    }
  }

  /**
   * If we ended up as a statement, then we know our children are set as
   * implicit return nodes, so no need to turn the conditional into an
   * expression for implicit return purposes.
   */
  implicitlyReturns() {
    return super.implicitlyReturns() && this.willPatchAsExpression();
  }

  setImplicitlyReturns() {
    super.setImplicitlyReturns();
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
    if (ifToken.type !== SourceType.IF) {
      throw this.error(
        `expected IF token at start of conditional, but got ${SourceType[ifToken.type]}`
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
      token => token.type === SourceType.ELSE
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
      token => token.type === SourceType.THEN
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
