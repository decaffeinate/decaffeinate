import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import { While } from 'decaffeinate-parser/dist/nodes';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import LoopPatcher from './LoopPatcher';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends LoopPatcher {
  node: While;

  condition: NodePatcher;
  guard: NodePatcher | null;

  constructor(patcherContext: PatcherContext, condition: NodePatcher, guard: NodePatcher | null, body: BlockPatcher) {
    super(patcherContext, body);
    this.condition = condition;
    this.guard = guard;
  }

  initialize(): void {
    this.condition.setRequiresExpression();
    if (this.guard !== null) {
      this.guard.setRequiresExpression();
    }
  }

  /**
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? 'then' BODY
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? NEWLINE INDENT BODY
   */
  patchAsStatement(): void {
    if (this.body && !this.body.inline()) {
      this.body.setIndent(this.getLoopBodyIndent());
    }

    // `until a` → `while a`
    //  ^^^^^       ^^^^^
    let whileToken = notNull(this.sourceTokenAtIndex(this.getWhileTokenIndex()));

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
    this.condition.patch({ needsParens: false });

    if (this.guard) {
      let guardNeedsParens = !this.guard.isSurroundedByParentheses();
      if (this.body && this.body.inline()) {
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
      this.guard.patch({ needsParens: false });

      // `while (a) {\n  if (b` → `while (a) {\n  if (b) {`
      //                                               ^^^
      this.insert(this.guard.outerEnd, `${guardNeedsParens ? ')' : ''} {`);
    } else {
      // `while (a` → `while (a) {`
      //                       ^^^
      this.insert(this.condition.outerEnd, `${conditionNeedsParens ? ')' : ''} {`);
    }

    let thenIndex = this.getThenTokenIndex();
    if (thenIndex) {
      let thenToken = notNull(this.sourceTokenAtIndex(thenIndex));
      let nextToken = this.sourceTokenAtIndex(notNull(thenIndex.next()));
      if (nextToken) {
        this.remove(thenToken.start, nextToken.start);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }

    this.patchPossibleNewlineAfterLoopHeader(
      this.guard ? this.guard.outerEnd : this.condition.outerEnd);
    this.patchBody();

    if (this.guard) {
      // Close the guard's `if` consequent block.
      if (this.body) {
        this.body.insertLineAfter('}', this.getOuterLoopBodyIndent());
      } else {
        this.insert(this.contentEnd, '}');
      }
    }

    // Close the `while` body block.
    if (this.body) {
      this.body.insertLineAfter('}', this.getLoopIndent());
    } else {
      this.insert(this.contentEnd, '}');
    }
  }

  /**
   * @private
   */
  getWhileTokenIndex(): SourceTokenListIndex {
    let whileTokenIndex = this.contentStartTokenIndex;
    let whileToken = this.sourceTokenAtIndex(whileTokenIndex);
    if (!whileToken || whileToken.type !== SourceType.WHILE) {
      throw this.error(`could not get first token of 'while' loop`);
    }
    return whileTokenIndex;
  }

  /**
   * @private
   */
  getThenTokenIndex(): SourceTokenListIndex | null {
    let whileTokenIndex = this.getWhileTokenIndex();
    if (!whileTokenIndex) {
      throw this.error(`could not get first token of 'while' loop`);
    }

    let searchStart;
    if (this.guard) {
      searchStart = this.guard.outerEnd;
    } else {
      searchStart = this.condition.outerEnd;
    }
    let searchEnd;
    if (this.body) {
      searchEnd = this.body.outerStart;
    } else {
      // Look one more token since sometimes the `then` isn't included in the range.
      let nextToken = this.nextSemanticToken();
      if (nextToken) {
        searchEnd = nextToken.end;
      } else {
        searchEnd = this.contentEnd;
      }
    }

    // `while a then …`
    return this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart, searchEnd, token => token.type === SourceType.THEN
    );
  }

  getLoopBodyIndent(): string {
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
