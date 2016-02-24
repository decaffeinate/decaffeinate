import NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, body: ?NodePatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.body = body;
  }

  /**
   * ( 'while' | 'until' ) CONDITION 'then' BODY
   * ( 'while' | 'until' ) CONDITION NEWLINE INDENT BODY
   * BODY ( 'while' | 'until' ) CONDITION
   * 'loop' 'then' BODY
   * 'loop' NEWLINE INDENT BODY
   */
  patchAsStatement() {
    // `until a` → `while a`
    //  ^^^^^       ^^^^^
    let whileToken = this.context.tokenAtIndex(this.startTokenIndex);
    let isLoop = this.context.source.slice(...whileToken.range) === 'loop';

    if (isLoop) {
      this.overwrite(...whileToken.range, 'while (true) {');
    } else {
      this.overwrite(...whileToken.range, 'while');

      let conditionNeedsParens = !this.condition.isSurroundedByParentheses();
      if (conditionNeedsParens) {
        // `while a` → `while (a`
        //                    ^
        this.insert(this.condition.before, '(');
      }

      if (this.node.isUntil) {
        this.condition.negate();
      }
      this.condition.patch();

      if (conditionNeedsParens) {
        // `while (a` → `while (a) {`
        //                       ^^^
        this.insert(this.condition.after, ') {');
      } else {
        // `while (a)` → `while (a) {`
        //                         ^^
        this.insert(this.condition.after, ' {');
      }
    }

    this.body.patch({ leftBrace: false });
  }

  patchAsExpression() {
    throw this.error(`cannot handle 'while' used as an expression (yet)`);
  }
}
