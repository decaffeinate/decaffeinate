import NodePatcher from './../../../patchers/NodePatcher.js';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { COMMA, LBRACE } from 'coffee-lex';
import { isSemanticToken } from '../../../utils/types.js';

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, members: Array<NodePatcher>) {
    super(node, context, editor);
    this.members = members;
  }

  initialize() {
    this.members.forEach(member => member.setRequiresExpression());
  }

  /**
   * Objects as expressions are very similar to their CoffeeScript equivalents.
   */
  patchAsExpression() {
    let implicitObject = this.isImplicitObject();
    if (implicitObject) {
      let curlyBraceInsertionPosition = this.innerStart;
      let textToInsert = '{';
      let shouldIndent = false;
      if (this.shouldExpandCurlyBraces()) {
        if (this.implicitlyReturns() && !this.isSurroundedByParentheses()) {
          textToInsert = `{\n${this.getIndent()}`;
          shouldIndent = true;
        } else {
          let tokenIndexBeforeOuterStartTokenIndex = this.outerStartTokenIndex;
          if (!this.isSurroundedByParentheses()) {
            tokenIndexBeforeOuterStartTokenIndex = tokenIndexBeforeOuterStartTokenIndex.previous();
          }

          if (tokenIndexBeforeOuterStartTokenIndex) {
            let precedingTokenIndex = this.context.sourceTokens.lastIndexOfTokenMatchingPredicate(
              isSemanticToken,
              tokenIndexBeforeOuterStartTokenIndex
            );
            if (precedingTokenIndex) {
              let precedingToken = this.sourceTokenAtIndex(precedingTokenIndex);
              curlyBraceInsertionPosition = precedingToken.end;
              let precedingTokenText = this.sourceOfToken(precedingToken);
              let lastCharOfToken = precedingTokenText[precedingTokenText.length - 1];
              let needsSpace = (
                lastCharOfToken === ':' ||
                lastCharOfToken === '=' ||
                lastCharOfToken === ','
              );
              if (needsSpace) {
                textToInsert = ' {';
              }
            }
          }
        }
      }
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
  patchAsStatement() {
    let needsParentheses = !this.isSurroundedByParentheses();
    let implicitObject = this.isImplicitObject();
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

  /**
   * @private
   */
  shouldExpandCurlyBraces(): boolean {
    return (
      this.isMultiline() ||
      this.parent instanceof ObjectInitialiserMemberPatcher
    );
  }

  /**
   * @private
   */
  patchMembers() {
    this.members.forEach((member, i, members) => {
      member.patch();
      if (i !== members.length - 1) {
        if (!member.hasSourceTokenAfter(COMMA)) {
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
    let tokens = this.context.sourceTokens;
    let indexOfFirstToken = tokens.indexOfTokenStartingAtSourceIndex(this.contentStart);
    return tokens.tokenAtIndex(indexOfFirstToken).type !== LBRACE;
  }

  /**
   * Starting a statement with an object always requires parens.
   */
  statementNeedsParens(): boolean {
    return true;
  }
}
