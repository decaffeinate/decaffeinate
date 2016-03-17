import NodePatcher from './../../../patchers/NodePatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Editor, Node, ParseContext, SourceTokenListIndex } from './../../../patchers/types.js';
import { LOOP, THEN, WHILE } from 'coffee-lex';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, guard: ?NodePatcher, body: ?BlockPatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
  }

  /**
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? 'then' BODY
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? NEWLINE INDENT BODY
   * 'loop' 'then' BODY
   * 'loop' NEWLINE INDENT BODY
   */
  patchAsStatement() {
    // `until a` → `while a`
    //  ^^^^^       ^^^^^
    let whileToken = this.sourceTokenAtIndex(this.getWhileTokenIndex());
    let isLoop = whileToken.type === LOOP;

    if (isLoop) {
      this.overwrite(whileToken.start, whileToken.end, 'while (true) {');
    } else {
      this.overwrite(whileToken.start, whileToken.end, 'while');

      let conditionNeedsParens = !this.condition.isSurroundedByParentheses();
      if (conditionNeedsParens) {
        // `while a` → `while (a`
        //                    ^
        this.insert(this.condition.outerStart, '(');
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
          this.condition.outerEnd,
          this.guard.outerStart,
          `${conditionNeedsParens ? ')' : ''} {\n${bodyIndent}if ${guardNeedsParens ? '(' : ''}`
        );
        this.guard.patch();

        // `while (a) {\n  if (b` → `while (a) {\n  if (b) {`
        //                                               ^^^
        this.insert(this.guard.outerEnd, `${guardNeedsParens ? ')' : ''} {`);
        this.body.indent();
      } else {
        // `while (a` → `while (a) {`
        //                       ^^^
        this.insert(this.condition.outerEnd, `${conditionNeedsParens ? ')' : ''} {`);
      }
    }

    let thenIndex = this.getThenTokenIndex();
    if (thenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenIndex);
      let nextToken = this.sourceTokenAtIndex(thenIndex.next());
      this.remove(thenToken.start, nextToken.start);
    }

    this.body.patch({ leftBrace: false, rightBrace: false });

    if (this.guard) {
      // Close the guard's `if` consequent block.
      if (this.body.inline()) {
        this.insert(this.body.innerEnd, ' }');
      } else {
        this.body.appendLineAfter('}');
      }
    }

    // Close the `while` body block.
    if (this.body.inline()) {
      this.insert(this.body.innerEnd, ' }');
    } else {
      this.appendLineAfter('}');
    }
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
  getWhileTokenIndex(): SourceTokenListIndex {
    let whileTokenIndex = this.contentStartTokenIndex;
    let whileToken = this.sourceTokenAtIndex(whileTokenIndex);
    if (!whileToken) {
      throw this.error(`could not get first token of 'while' loop`);
    }
    switch (whileToken.type) {
      case LOOP:
      case WHILE:
        return whileTokenIndex;

      default:
        throw this.error(
          `expected 'while' token to be type WHILE or LOOP, got ${whileToken.type.name}`
        );
    }
  }

  /**
   * @private
   */
  getThenTokenIndex(): ?SourceTokenListIndex {
    let whileTokenIndex = this.getWhileTokenIndex();
    if (!whileTokenIndex) {
      throw this.error(`could not get first token of 'while' loop`);
    }

    let whileToken = this.sourceTokenAtIndex(whileTokenIndex);
    if (whileToken.type === LOOP) {
      // `loop then …`
      let nextTokenIndex = whileTokenIndex.next();
      let nextToken = this.sourceTokenAtIndex(nextTokenIndex);
      if (!nextToken) {
        throw this.error(`expected another token after 'loop' but none was found`);
      }
      return nextToken.type === THEN ? nextTokenIndex : null;
    } else {
      // `while a then …`
      return this.indexOfSourceTokenBetweenPatchersMatching(
        this.condition,
        this.guard || this.body,
        token => token.type === THEN
      );
    }
  }
}
