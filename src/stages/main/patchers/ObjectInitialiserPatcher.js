import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { COMMA, LBRACE } from 'coffee-lex';

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, members: Array<NodePatcher>) {
    super(node, context, editor);
    this.members = members;
  }

  /**
   * Objects as expressions are very similar to their CoffeeScript equivalents.
   */
  patchAsExpression() {
    let implicitObject = this.isImplicitObject();
    if (implicitObject) {
      this.insert(this.innerStart, '{');
    }
    this.members.forEach((member, i, members) => {
      member.patch();
      if (i !== members.length - 1) {
        if (!member.hasSourceTokenAfter(COMMA)) {
          this.insert(member.outerEnd, ',');
        }
      }
    });
    if (implicitObject) {
      this.insert(this.innerEnd, '}');
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
    if (needsParentheses) {
      this.insert(this.contentStart, '(');
    }
    this.patchAsExpression();
    if (needsParentheses) {
      this.insert(this.contentEnd, ')');
    }
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
}
