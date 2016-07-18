import NodePatcher from '../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';
import type { SourceTokenListIndex } from 'coffee-lex';
import { IF } from 'coffee-lex';

/**
 * Normalizes conditionals by rewriting post-`if` into standard `if`, e.g.
 *
 *   return [] unless list?
 *
 * becomes
 *
 *   unless list? then return []
 */
export default class ConditionalPatcher extends NodePatcher {
  condition: NodePatcher;
  guard: ?NodePatcher;
  body: ?NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, consequent: NodePatcher, alternate: ?NodePatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  patchAsExpression() {
    if (this.isPostIf()) {
      this.patchPostIf();
    } else {
      this.condition.patch();
      this.consequent.patch();
      if (this.alternate !== null) {
        this.alternate.patch();
      }
    }
  }

  /**
   * `CONSEQUENT 'if' CONDITION` → `if CONDITION then CONSEQUENT`
   * `CONSEQUENT 'unless' CONDITION` → `unless CONDITION then CONSEQUENT`
   */
  patchPostIf() {
    this.condition.patch();

    let ifTokenIndex = this.getIfTokenIndex();
    let ifToken = this.sourceTokenAtIndex(ifTokenIndex);

    if (ifToken) {
      this.remove(this.consequent.outerEnd, ifToken.start);
      this.move(ifToken.start, this.condition.outerEnd, this.consequent.outerStart);
      this.insertRight(this.condition.outerEnd, ` then `);
    }

    this.consequent.patch();
  }

  isPostIf(): boolean {
    return this.condition.contentStart > this.consequent.contentStart;
  }

  getIfTokenIndex(): SourceTokenListIndex {
    let start = this.contentStartTokenIndex;
    let index = this.condition.outerStartTokenIndex;

    while (index !== start) {
      let token = this.sourceTokenAtIndex(index);
      if (token && token.type === IF) {
        break;
      }
      index = index.previous();
    }

    if (!index) {
      throw this.error('unable to find `if` token in conditional');
    }

    return index;
  }
}
