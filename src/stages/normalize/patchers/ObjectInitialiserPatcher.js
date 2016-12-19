import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, members: Array<NodePatcher>) {
    super(patcherContext);
    this.members = members;
  }

  patchAsExpression() {
    for (let member of this.members) {
      // If the last token of the arg is a comma, then the actual delimiter must
      // be a newline and the comma is unnecessary and can cause a syntax error
      // when combined with other normalize stage transformations. So just
      // remove the redundant comma.
      let lastToken = member.lastToken();
      if (lastToken.type === SourceType.COMMA) {
        this.remove(lastToken.start, lastToken.end);
      }
      member.patch();
    }
  }
}
