import NodePatcher from './NodePatcher.js';
import type { Editor, Node, ParseContext, Token } from './types.js';

export default class SwitchPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher, cases: Array<NodePatcher>, alternate: ?NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this.cases = cases;
    this.alternate = alternate;
  }

  patchAsStatement() {
    if (this.expression) {
      // `switch a` → `switch (a`
      //                      ^
      if (!this.expression.isSurroundedByParentheses()) {
        this.expression.insertBefore('(');
      }

      this.expression.patch();

      // `switch (a` → `switch (a)`
      //                         ^
      if (!this.expression.isSurroundedByParentheses()) {
        this.expression.insertAfter(')');
      }

      // `switch (a)` → `switch (a) {`
      //                            ^
      this.expression.insertAfter(' {');
    } else {
      this.cases.forEach(casePatcher => casePatcher.negate());

      // `switch` → `switch (false) {`
      //                   ^^^^^^^^^^
      let switchToken = this.getSwitchToken();
      this.insert(switchToken.range[1], ' (false) {');
    }

    this.cases.forEach(casePatcher => casePatcher.patch());

    this.overwriteElse();
    if (this.alternate) {
      this.alternate.patch({ leftBrace: false, rightBrace: false });
    }

    this.appendLineAfter('}');
  }

  setImplicitlyReturns() {
    this.cases.forEach(casePatcher => casePatcher.setImplicitlyReturns());
    if (this.alternate) {
      this.alternate.setImplicitlyReturns();
    }
  }

  patchAsExpression() {
    this.setImplicitlyReturns();

    // `` → `(function() {\n`
    //       ^^^^^^^^^^^^^^^
    this.insertBefore('(function() {\n');

    this.patchAsStatement();

    // `` → `})()`
    //       ^^^^
    this.appendLineAfter('})()');
  }

  /**
   * @private
   */
  overwriteElse() {
    // `else` → `default:`
    //           ^^^^^^^^
    let elseToken = this.getElseToken();
    if (elseToken) {
      this.overwrite(...elseToken.range, 'default:');
    }
  }

  /**
   * @private
   */
  getElseToken(): Token {
    if (!this.alternate) {
      return null;
    }

    return this.tokens.find(token => token.type === 'ELSE');
  }

  /**
   * @private
   */
  getSwitchToken(): Token {
    return this.tokens.find(token => token.type === 'SWITCH');
  }

}
