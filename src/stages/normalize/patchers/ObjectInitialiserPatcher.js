import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { COMMA } from 'coffee-lex';

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, members: Array<NodePatcher>) {
    super(node, context, editor);
    this.members = members;
  }

  patchAsExpression() {
    for (let member of this.members) {
      // If the last token of the arg is a comma, then the actual delimiter must
      // be a newline and the comma is unnecessary and can cause a syntax error
      // when combined with other normalize stage transformations. So just
      // remove the redundant comma.
      let lastToken = member.lastToken();
      if (lastToken.type === COMMA) {
        this.remove(lastToken.start, lastToken.end);
      }
      member.patch();
    }
  }
}
