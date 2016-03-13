import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

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
      this.insert(this.outerStart, '(');
    }
    // `(throw err` → `(() => { throw err`
    //                  ^^^^^^^^
    this.insert(this.innerStart, '() => { ');
    this.patchAsStatement();
    // `(() => { throw err` → `(() => { throw err }`
    //                                           ^^
    this.insert(this.innerEnd, ' }');
    if (!hasParens) {
      // `(() => { throw err }` → `(() => { throw err })`
      //                                               ^
      this.insert(this.outerEnd, ')');
    }
    // `(() => { throw err })` → `(() => { throw err })()`
    //                                                 ^^
    this.insert(this.outerEnd, '()');
  }

  patchAsStatement() {
    this.expression.patch();
  }

  /**
   * This is here so that we can add the `()` outside any existing parens.
   */
  allowPatchingOuterBounds(): boolean {
    return true;
  }
}
