import NodePatcher from './../../../patchers/NodePatcher.js';
import LoopPatcher from './LoopPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { PatcherContext, SourceTokenListIndex } from './../../../patchers/types.js';
import { SourceType } from 'coffee-lex';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends LoopPatcher {
  condition: NodePatcher;
  guard: ?NodePatcher;

  constructor(patcherContext: PatcherContext, condition: NodePatcher, guard: ?NodePatcher, body: BlockPatcher) {
    super(patcherContext, body);
    this.condition = condition;
    this.guard = guard;
  }

  /**
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? 'then' BODY
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? NEWLINE INDENT BODY
   * 'loop' 'then' BODY
   * 'loop' NEWLINE INDENT BODY
   */
  patchAsStatement() {
    if (!this.body.inline()) {
      this.body.setIndent(this.getLoopBodyIndent());
    }

    // `until a` → `while a`
    //  ^^^^^       ^^^^^
    let whileToken = this.sourceTokenAtIndex(this.getWhileTokenIndex());
    let isLoop = whileToken.type === SourceType.LOOP;

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
        if (this.body.inline()) {
          // `while (a when b` → `while (a) { if (b`
          //          ^^^^^^              ^^^^^^^^
          this.overwrite(
            this.condition.outerEnd,
            this.guard.outerStart,
            `${conditionNeedsParens ? ')' : ''} { if ${guardNeedsParens ? '(' : ''}`
          );
        } else {
          // `while (a when b` → `while (a) {\n  if (b`
          //          ^^^^^^              ^^^^^^^^^^^
          this.overwrite(
            this.condition.outerEnd,
            this.guard.outerStart,
            `${conditionNeedsParens ? ')' : ''} {\n${this.getOuterLoopBodyIndent()}if ${guardNeedsParens ? '(' : ''}`
          );

        }
        this.guard.patch();

        // `while (a) {\n  if (b` → `while (a) {\n  if (b) {`
        //                                               ^^^
        this.insert(this.guard.outerEnd, `${guardNeedsParens ? ')' : ''} {`);
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

    this.patchPossibleNewlineAfterLoopHeader(
      this.guard ? this.guard.outerEnd : this.condition.outerEnd);
    this.patchBodyWithPossibleItemVariable();

    if (this.guard) {
      // Close the guard's `if` consequent block.
      this.body.insertLineAfter('}', this.getOuterLoopBodyIndent());
    }

    // Close the `while` body block.
    this.body.insertLineAfter('}', this.getLoopIndent());
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
      case SourceType.LOOP:
      case SourceType.WHILE:
        return whileTokenIndex;

      default:
        throw this.error(
          `expected 'while' token to be type WHILE or LOOP, got ${SourceType[whileToken.type]}`
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
    if (whileToken.type === SourceType.LOOP) {
      // `loop then …`
      let nextTokenIndex = whileTokenIndex.next();
      let nextToken = this.sourceTokenAtIndex(nextTokenIndex);
      if (!nextToken) {
        throw this.error(`expected another token after 'loop' but none was found`);
      }
      return nextToken.type === SourceType.THEN ? nextTokenIndex : null;
    } else {
      // `while a then …`
      return this.indexOfSourceTokenBetweenPatchersMatching(
        this.guard || this.condition,
        this.body,
        token => token.type === SourceType.THEN
      );
    }
  }

  getLoopBodyIndent() {
    if (this.guard) {
      return this.getOuterLoopBodyIndent() + this.getProgramIndentString();
    } else {
      return this.getOuterLoopBodyIndent();
    }
  }

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression();
  }
}
