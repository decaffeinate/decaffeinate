import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { Conditional } from 'decaffeinate-parser/dist/nodes';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import getEnclosingScopeBlock from '../../../utils/getEnclosingScopeBlock';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';

export default class ConditionalPatcher extends NodePatcher {
  node: Conditional;
  condition: NodePatcher;
  consequent: BlockPatcher | null;
  alternate: BlockPatcher | null;

  negated: boolean = false;

  constructor(
    patcherContext: PatcherContext,
    condition: NodePatcher,
    consequent: BlockPatcher | null,
    alternate: BlockPatcher | null
  ) {
    super(patcherContext);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  initialize(): void {
    this.condition.setRequiresExpression();
    getEnclosingScopeBlock(this).markIIFEPatcherDescendant(this);
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
    return consequent.prefersToPatchAsExpression() && alternate.prefersToPatchAsExpression();
  }

  setExpression(force: boolean = false): boolean {
    let willPatchAsExpression = super.setExpression(force);
    if (willPatchAsExpression && this.willPatchAsTernary()) {
      if (this.consequent) {
        this.consequent.setRequiresExpression();
      }
      if (this.alternate) {
        this.alternate.setRequiresExpression();
      }
      return true;
    }
    return false;
  }

  negate(): void {
    this.negated = !this.negated;
  }

  willPatchAsTernary(): boolean {
    return (
      this.prefersToPatchAsExpression() ||
      (this.forcedToPatchAsExpression() &&
        (!this.consequent || this.consequent.prefersToPatchAsExpression()) &&
        (!this.alternate || this.alternate.prefersToPatchAsExpression()))
    );
  }

  /**
   * @private
   */
  willPatchAsIIFE(): boolean {
    return !this.willPatchAsTernary() && this.forcedToPatchAsExpression();
  }

  patchAsExpression({ needsParens }: PatchOptions = {}): void {
    let addParens = this.negated || (needsParens && !this.isSurroundedByParentheses());

    // `if a then b` → `a then b`
    //  ^^^
    this.overwrite(this.contentStart, this.condition.outerStart, `${this.negated ? '!' : ''}${addParens ? '(' : ''}`);

    if (this.node.isUnless) {
      this.condition.negate();
    }

    this.condition.patch();

    let thenTokenIndex = this.getThenTokenIndex();
    if (thenTokenIndex) {
      let thenToken = notNull(this.sourceTokenAtIndex(thenTokenIndex));
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
      if (!elseToken) {
        throw this.error('Expected else token in conditional.');
      }
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
        this.insert(consequent.outerEnd, ' : undefined');
      }
    } else if (alternate) {
      if (!elseToken) {
        throw this.error('Expected else token in conditional.');
      }
      // We might have just a semicolon as the consequent. In that case, it will be null in the AST
      // but we will need to remove it.
      let semicolonTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
        this.condition.outerEnd,
        elseToken.start,
        token => token.type === SourceType.SEMICOLON
      );
      if (semicolonTokenIndex) {
        let semicolonToken = this.sourceTokenAtIndex(semicolonTokenIndex);
        if (semicolonToken) {
          this.remove(semicolonToken.start, semicolonToken.end);
        }
      }
      this.overwrite(elseToken.start, elseToken.end, 'undefined :');
      alternate.patch();
    } else {
      if (elseToken !== null) {
        this.overwrite(elseToken.start, elseToken.end, 'undefined : undefined');
      } else {
        this.insert(this.condition.outerEnd, ' undefined : undefined');
      }
    }

    if (addParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  patchAsForcedExpression(): void {
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

  patchAsIIFE(): void {
    if (this.negated) {
      this.insert(this.innerStart, '!');
    }

    // We're only patched as an expression due to a parent instructing us to,
    // and the indent level is more logically the indent level of our parent.
    let baseIndent = notNull(this.parent).getIndent(0);
    let conditionIndent = notNull(this.parent).getIndent(1);
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

  patchAsStatement(): void {
    this.patchConditionForStatement();
    this.patchConsequentForStatement();
    this.patchAlternateForStatement();
  }

  /**
   * @private
   */
  patchConditionForStatement(): void {
    // `unless a` → `if a`
    //  ^^^^^^        ^^
    let ifToken = notNull(this.sourceTokenAtIndex(this.getIfSourceTokenIndex()));
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
      let thenToken = notNull(this.sourceTokenAtIndex(thenTokenIndex));
      // `if (a) then b` → `if (a) b`
      //         ^^^^^
      if (this.consequent) {
        this.remove(thenToken.start, this.consequent.outerStart);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }
  }

  /**
   * @private
   */
  patchConsequentForStatement(): void {
    this.insert(this.condition.outerEnd, ' {');

    if (this.alternate) {
      let elseTokenIndex = notNull(this.getElseSourceTokenIndex());
      let elseToken = notNull(this.sourceTokenAtIndex(elseTokenIndex));
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
  patchAlternateForStatement(): void {
    let elseTokenIndex = this.getElseSourceTokenIndex();
    if (this.alternate && elseTokenIndex) {
      let ifToken = this.sourceTokenAtIndex(notNull(elseTokenIndex.next()));
      let isElseIf = ifToken ? ifToken.type === SourceType.IF : false;
      if (isElseIf) {
        // Let the nested ConditionalPatcher handle braces.
        this.alternate.patch({ leftBrace: false, rightBrace: false });
      } else {
        let elseToken = notNull(this.sourceTokenAtIndex(elseTokenIndex));
        let leftBracePosition = elseToken.end;
        this.insert(leftBracePosition, ' {');
        this.alternate.patch({ leftBrace: false });
      }
    } else if (elseTokenIndex !== null) {
      let elseToken = notNull(this.sourceTokenAtIndex(elseTokenIndex));
      this.insert(elseToken.end, ' {}');
    } else if (super.implicitlyReturns()) {
      let emptyImplicitReturnCode = this.implicitReturnPatcher().getEmptyImplicitReturnCode();
      if (emptyImplicitReturnCode) {
        this.insert(this.innerEnd, ' else {\n');
        this.insert(this.innerEnd, `${this.getIndent(1)}${emptyImplicitReturnCode}\n`);
        this.insert(this.innerEnd, `${this.getIndent()}}`);
      }
    }
  }

  /**
   * If we ended up as a statement, then we know our children are set as
   * implicit return nodes, so no need to turn the conditional into an
   * expression for implicit return purposes.
   */
  implicitlyReturns(): boolean {
    return super.implicitlyReturns() && this.willPatchAsExpression();
  }

  setImplicitlyReturns(): void {
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
    let ifToken = notNull(this.sourceTokenAtIndex(ifTokenIndex));
    if (ifToken.type !== SourceType.IF) {
      throw this.error(`expected IF token at start of conditional, but got ${SourceType[ifToken.type]}`);
    }
    return ifTokenIndex;
  }
  /**
   * Gets the index of the token representing the `else` between consequent and
   * alternate.
   *
   * @private
   */
  getElseSourceTokenIndex(): SourceTokenListIndex | null {
    let elseTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.consequent !== null ? this.consequent.outerEnd : this.condition.outerEnd,
      this.alternate !== null ? this.alternate.outerStart : this.outerEnd,
      token => token.type === SourceType.ELSE
    );
    if (this.alternate !== null && !elseTokenIndex) {
      throw this.error(
        'expected ELSE token between consequent and alternate',
        this.consequent !== null ? this.consequent.outerEnd : this.condition.outerEnd,
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
  getThenTokenIndex(): SourceTokenListIndex | null {
    let searchEnd;
    if (this.consequent) {
      searchEnd = this.consequent.outerStart;
    } else if (this.alternate) {
      searchEnd = this.alternate.outerStart;
    } else {
      let nextToken = this.nextSemanticToken();
      if (nextToken) {
        searchEnd = nextToken.end;
      } else {
        searchEnd = this.contentEnd;
      }
    }

    return this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.condition.outerEnd,
      searchEnd,
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

    return this.consequent.allCodePathsPresent() && this.alternate.allCodePathsPresent();
  }
}
