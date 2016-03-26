import NodePatcher from '../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor, SourceToken } from './../../../patchers/types.js';
import { FOR } from 'coffee-lex';

export default class ForPatcher extends NodePatcher {
  keyAssignee: ?NodePatcher;
  valAssignee: ?NodePatcher;
  target: NodePatcher;
  filter: ?NodePatcher;
  body: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, filter: ?NodePatcher, body: NodePatcher) {
    super(node, context, editor);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
    this.body = body;
  }

  patchAsExpression() {
    if (this.keyAssignee) {
      this.keyAssignee.patch();
    }
    if (this.valAssignee) {
      this.valAssignee.patch();
    }
    this.target.patch();
    if (this.filter) {
      this.filter.patch();
    }
    this.body.patch();

    if (this.isPostFor()) {
      this.normalize();
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * @private
   */
  isPostFor(): boolean {
    return this.body.contentStart < this.target.contentStart;
  }

  /**
   * @private
   */
  normalize() {
    let forToken = this.getForToken();
    let forThroughEnd = this.slice(forToken.start, this.contentEnd);
    let startUntilFor = this.slice(this.contentStart, this.body.outerEnd);
    this.overwrite(
      this.contentStart,
      this.contentEnd,
      `${forThroughEnd} then ${startUntilFor}`
    );
  }

  /**
   * @private
   */
  getForToken(): SourceToken {
    if (this.isPostFor()) {
      let afterForToken = this.getFirstHeaderPatcher();
      let index = this.indexOfSourceTokenBetweenPatchersMatching(
        this.body, afterForToken,
        token => token.type === FOR
      );

      if (!index) {
        throw this.error(`cannot find 'for' token in loop`);
      }

      return this.sourceTokenAtIndex(index);
    } else {
      let token = this.sourceTokenAtIndex(this.contentStartTokenIndex);

      if (!token || token.type !== FOR) {
        throw this.error(`expected 'for' at start of loop`);
      }

      return token;
    }
  }

  /**
   * @private
   */
  getFirstHeaderPatcher(): NodePatcher {
    let candidates = [this.keyAssignee, this.valAssignee, this.target];
    let result = null;
    candidates.forEach(candidate => {
      if (!candidate) { return; }
      if (result === null || candidate.contentStart < result.contentStart) {
        result = candidate;
      }
    });
    if (result === null) {
      throw this.error(`cannot get first patcher of 'for' loop header`);
    }
    return result;
  }
}
