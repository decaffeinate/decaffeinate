import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext, assignee, expression);
    this.assignee = assignee;
    this.expression = expression;
  }

  patchAsExpression() {
    this.assignee.patch();
    this.removeUnnecessaryThenToken();
    this.expression.patch();
  }

  /**
   * Assignment operators are allowed to have a `then` token after them for some
   * reason, and it doesn't do anything, so just get rid of it.
   */
  removeUnnecessaryThenToken() {
    let thenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      token => token.type === SourceType.THEN
    );
    if (thenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenIndex);
      if (this.slice(thenToken.start - 1, thenToken.start) === ' ') {
        this.remove(thenToken.start - 1, thenToken.end);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }
  }
}
