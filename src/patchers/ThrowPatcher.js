import NodePatcher from './NodePatcher.js';
import type { Node, ParseContext, Editor } from './types.js';

export default class ThrowPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  /**
   * Throw in JavaScript is a statement only, so we'd prefer it stay that way.
   */
  prefersToPatchAsExpression(): boolean {
    return false;
  }

  /**
   * Throw statements that are in the implicit return position should simply
   * be left alone as they're pure statements in JS and don't have a value.
   */
  setImplicitlyReturns() {
    // throw can't be an implicit return
  }

  /**
   * `throw` statements cannot normally be used as expressions, so we wrap them
   * in an arrow function IIFE.
   */
  patchAsExpression() {
    let hasParens = this.isSurroundedByParentheses();
    if (!hasParens) {
      // `throw err` → `(throw err`
      //                ^
      this.insertAtStart('(');
    }
    // `(throw err` → `(() => { throw err`
    //                  ^^^^^^^^
    this.insertAtStart('() => { ');
    this.patchAsStatement();
    // `(() => { throw err` → `(() => { throw err }`
    //                                           ^^
    this.insertAtEnd(' }');
    if (!hasParens) {
      // `(() => { throw err }` → `(() => { throw err })`
      //                                               ^
      this.insertAtEnd(')');
    }
    // `(() => { throw err })` → `(() => { throw err })()`
    //                                                 ^^
    this.insertAfter('()');
  }

  patchAsStatement() {
    this.expression.patch();
  }
}
