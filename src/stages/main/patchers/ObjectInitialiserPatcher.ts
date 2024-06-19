import { SourceType, SourceTokenListIndex } from 'coffee-lex';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import { isSemanticToken } from '../../../utils/types';
import NodePatcher from './../../../patchers/NodePatcher';
import AssignOpPatcher from './AssignOpPatcher';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher';
import SpreadPatcher from './SpreadPatcher';

export interface OpenCurlyInfo {
  curlyBraceInsertionPosition: number;
  textToInsert: string;
  shouldIndent: boolean;
}

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
  members: Array<ObjectInitialiserMemberPatcher | AssignOpPatcher | SpreadPatcher>;

  constructor(patcherContext: PatcherContext, members: Array<ObjectInitialiserMemberPatcher | AssignOpPatcher>) {
    super(patcherContext);
    this.members = members;
  }

  initialize(): void {
    this.members.forEach((member) => member.setRequiresExpression());
  }

  setAssignee(): void {
    this.members.forEach((member) => member.setAssignee());
    super.setAssignee();
  }

  setExpression(force: boolean): boolean {
    if (this.isImplicitObject()) {
      const { curlyBraceInsertionPosition } = this.getOpenCurlyInfo();
      this.adjustBoundsToInclude(curlyBraceInsertionPosition);
    }
    return super.setExpression(force);
  }

  /**
   * Objects as expressions are very similar to their CoffeeScript equivalents.
   */
  patchAsExpression(): void {
    const implicitObject = this.isImplicitObject();
    if (implicitObject) {
      const { curlyBraceInsertionPosition, textToInsert, shouldIndent } = this.getOpenCurlyInfo();
      this.insert(curlyBraceInsertionPosition, textToInsert);
      if (shouldIndent) {
        this.indent();
      }
    }
    this.patchMembers();
    if (implicitObject) {
      if (this.shouldExpandCurlyBraces() && !this.isSurroundedByParentheses()) {
        this.appendLineAfter('}', -1);
      } else {
        this.insert(this.innerEnd, '}');
      }
    }
  }

  getOpenCurlyInfo(): OpenCurlyInfo {
    let curlyBraceInsertionPosition = this.innerStart;
    let textToInsert = '{';
    let shouldIndent = false;
    if (this.shouldExpandCurlyBraces()) {
      if (this.implicitlyReturns() && !this.isSurroundedByParentheses()) {
        textToInsert = `{\n${this.getIndent()}`;
        shouldIndent = true;
      } else {
        let tokenIndexBeforeOuterStartTokenIndex: SourceTokenListIndex | null = this.outerStartTokenIndex;
        if (!this.isSurroundedByParentheses()) {
          tokenIndexBeforeOuterStartTokenIndex = tokenIndexBeforeOuterStartTokenIndex.previous();
        }

        if (tokenIndexBeforeOuterStartTokenIndex) {
          const precedingTokenIndex = this.context.sourceTokens.lastIndexOfTokenMatchingPredicate(
            isSemanticToken,
            tokenIndexBeforeOuterStartTokenIndex,
          );
          if (precedingTokenIndex) {
            const precedingToken = notNull(this.sourceTokenAtIndex(precedingTokenIndex));
            curlyBraceInsertionPosition = precedingToken.end;
            const precedingTokenText = this.sourceOfToken(precedingToken);
            const lastCharOfToken = precedingTokenText[precedingTokenText.length - 1];
            const needsSpace = lastCharOfToken === ':' || lastCharOfToken === '=' || lastCharOfToken === ',';
            if (needsSpace) {
              textToInsert = ' {';
            }
          }
        }
      }
    }
    return { curlyBraceInsertionPosition, textToInsert, shouldIndent };
  }

  /**
   * Objects as statements need to be wrapped in parentheses, or else they'll be
   * confused with blocks. That is, this is not an object [1]:
   *
   *   { a: 0 };
   *
   * But this is fine:
   *
   *   ({ a: 0 });
   *
   * [1]: It is actually valid code, though. It's a block with a labeled
   * statement `a` with a single expression statement, being the literal 0.
   */
  patchAsStatement(): void {
    const needsParentheses = !this.isSurroundedByParentheses();
    const implicitObject = this.isImplicitObject();
    if (needsParentheses) {
      this.insert(this.contentStart, '(');
    }
    if (implicitObject) {
      if (this.shouldExpandCurlyBraces() && !this.isSurroundedByParentheses()) {
        this.insert(this.innerStart, `{\n${this.getIndent()}`);
        this.indent();
      } else {
        this.insert(this.innerStart, '{');
      }
    }
    this.patchMembers();
    if (implicitObject) {
      if (this.shouldExpandCurlyBraces() && !this.isSurroundedByParentheses()) {
        this.appendLineAfter('}', -1);
      } else {
        this.insert(this.innerEnd, '}');
      }
    }
    if (needsParentheses) {
      this.insert(this.contentEnd, ')');
    }
  }

  private shouldExpandCurlyBraces(): boolean {
    return (
      this.isMultiline() ||
      (this.parent instanceof ObjectInitialiserMemberPatcher && notNull(this.parent.parent).isMultiline())
    );
  }

  private patchMembers(): void {
    this.members.forEach((member, i, members) => {
      member.patch();
      if (i !== members.length - 1) {
        if (!member.hasSourceTokenAfter(SourceType.COMMA)) {
          this.insert(member.outerEnd, ',');
        }
      }
    });
  }

  /**
   * Determines whether this object is implicit, i.e. it lacks braces.
   *
   *   a: b      # true
   *   { a: b }  # false
   */
  isImplicitObject(): boolean {
    const tokens = this.context.sourceTokens;
    const indexOfFirstToken = notNull(tokens.indexOfTokenStartingAtSourceIndex(this.contentStart));
    return notNull(tokens.tokenAtIndex(indexOfFirstToken)).type !== SourceType.LBRACE;
  }

  /**
   * Starting a statement with an object always requires parens.
   */
  statementNeedsParens(): boolean {
    return true;
  }
}
