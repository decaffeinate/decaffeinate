import NodePatcher from './NodePatcher.js';
import type { Editor, Node, ParseContext, Token } from './types.js';

export default class SwitchCasePatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, conditions: NodePatcher, consequent: NodePatcher) {
    super(node, context, editor);
    this.conditions = conditions;
    this.consequent = consequent;
  }

  patchAsStatement() {
    // `when a, b, c then d` → `a, b, c then d`
    //  ^^^^^
    let whenToken = this.getWhenToken();
    this.remove(whenToken.range[0], this.conditions[0].start);

    // `a, b, c then d` → `a b c then d`
    //   ^  ^
    this.getCommaTokens().forEach((comma) => {
      this.remove(...comma.range);
    });

    this.conditions.forEach((condition) => {
      // `a b c then d` → `case a: case b: case c: then d`
      //                   ^^^^^ ^^^^^^^ ^^^^^^^ ^
      condition.insertBefore('case ');
      condition.patch({ leftBrace: false, rightBrace: false });
      condition.insertAfter(':');
    });


    // `case a: case b: case c: then d → `case a: case b: case c: d`
    //                          ^^^^^
    let thenToken = this.getThenToken();
    if (thenToken) {
      this.remove(thenToken.range[0], this.consequent.start);
    }

    this.consequent.patch({ leftBrace: false, rightBrace: false });

    if (!this.getBreakToken() && !this.implicitlyReturns()) {
      if (thenToken) {
        // `case a: case b: case c: then d → `case a: case b: case c: d break`
        //                                                             ^^^^^^
        this.consequent.insertAfter(' break');
      } else {
        this.appendLineAfter('break', 1);
      }
    }
  }

  setImplicitlyReturns() {
    super.setImplicitlyReturns();
    this.consequent.setImplicitlyReturns();
  }

  patchAsExpression() {
    this.patchAsStatement();
  }

  negate() {
    this.conditions.forEach(condition => condition.negate());
  }

  /**
   * @private
   */
  getWhenToken(): ?Token {
    return this.tokens.find(token => token.type === 'LEADING_WHEN');
  }

  /**
   * @private
   */
  getCommaTokens(): Array<Token> {
    return this.tokens.filter(token => token.type === ',');
  }

  /**
   * @private
   */
  getBreakToken(): ?Token {
    return this.tokens.find(token => token.type === 'STATEMENT' && token.data === 'break');
  }

  /**
   * Gets the token representing the `then` between condition and consequent.
   *
   * @private
   */
  getThenToken(): ?Token {
    return this.tokenBetweenPatchersMatching(this.conditions[0], this.consequent, 'THEN');
  }

}
