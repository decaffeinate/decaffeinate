import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Token, Editor, Node, ParseContext } from './../../../patchers/types.js';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, guard: ?NodePatcher, body: ?NodePatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
  }

  /**
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? 'then' BODY
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? NEWLINE INDENT BODY
   * BODY ( 'while' | 'until' ) CONDITION ('when' GUARD)?
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

      if (this.guard) {
        let guardNeedsParens = !this.guard.isSurroundedByParentheses();
        let bodyIndent = this.body.getIndent();
        // `while (a when b` → `while (a) {\n  if (b`
        //          ^^^^^^              ^^^^^^^^^^^
        this.overwrite(
          this.condition.after,
          this.guard.before,
          `${conditionNeedsParens ? ')' : ''} {\n${bodyIndent}if ${guardNeedsParens ? '(' : ''}`
        );
        this.guard.patch();

        // `while (a) {\n  if (b` → `while (a) {\n  if (b) {`
        //                                               ^^^
        this.insert(this.guard.after, `${guardNeedsParens ? ')' : ''} {`);
        this.body.indent();
      } else {
        // `while (a` → `while (a) {`
        //                       ^^^
        this.insert(this.condition.after, `${conditionNeedsParens ? ')' : ''} {`);
      }
    }

    this.body.patch({ leftBrace: false, rightBrace: false });

    if (this.guard) {
      // Close the guard's `if` consequent block.
      this.body.appendLineAfter('}');
    }

    // Close the `while` body block.
    this.appendLineAfter('}');
  }

  patchAsExpression() {
    throw this.error(`cannot handle 'while' used as an expression (yet)`);
  }

  statementNeedsSemicolon() {
    return false;
  }

  /**
   * @private
   */
  getWhenToken(): ?Token {
    if (this.guard) {
      return this.tokenBetweenPatchersMatching(
        this.condition,
        this.guard,
        'WHEN'
      );
    } else {
      return null;
    }
  }
}
