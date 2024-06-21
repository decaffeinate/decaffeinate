import { SourceType, SourceToken } from 'coffee-lex';

import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';
import notNull from '../../../utils/notNull';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import postfixNodeNeedsOuterParens from '../../../utils/postfixNodeNeedsOuterParens';
import BlockPatcher from './BlockPatcher';

export default class ForPatcher extends NodePatcher {
  keyAssignee: NodePatcher | null;
  valAssignee: NodePatcher | null;
  target: NodePatcher;
  filter: NodePatcher | null;
  body: BlockPatcher;

  constructor(
    patcherContext: PatcherContext,
    keyAssignee: NodePatcher | null,
    valAssignee: NodePatcher | null,
    target: NodePatcher,
    filter: NodePatcher | null,
    body: BlockPatcher,
  ) {
    super(patcherContext);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
    this.body = body;
  }

  patchAsExpression(): void {
    let bodyPrefixLine = null;
    if (this.keyAssignee) {
      // The key assignee can't be a complex expression, so we don't need to
      // worry about checking canPatchAssigneeToJavaScript.
      this.keyAssignee.patch();
    }
    if (this.valAssignee) {
      bodyPrefixLine = this.patchValAssignee();
    }
    this.target.patch();
    if (this.filter) {
      this.filter.patch();
    }

    if (this.isPostFor()) {
      this.surroundThenUsagesInParens();
      const forToken = this.getForToken();
      const forThroughEnd = this.slice(forToken.start, this.contentEnd);

      const needsParens = postfixNodeNeedsOuterParens(this);
      this.remove(this.body.outerEnd, this.contentEnd);
      if (needsParens) {
        this.insert(this.body.outerStart, '(');
      }
      this.insert(this.body.outerStart, `${forThroughEnd} then `);
      if (needsParens) {
        this.insert(this.contentEnd, ')');
      }
    }

    if (bodyPrefixLine !== null) {
      if (this.body) {
        this.body.insertLineBefore(bodyPrefixLine);
      } else {
        this.insert(this.contentEnd, ` ${bodyPrefixLine}`);
      }
    }

    if (this.body) {
      this.body.patch();
    }
  }

  patchAsStatement(): void {
    this.patchAsExpression();
  }

  /**
   * Patch the value assignee, and if we need to add a line to the start of the
   * body, return that line. Otherwise, return null.
   */
  patchValAssignee(): string | null {
    if (!this.valAssignee) {
      throw this.error('Expected to find a valAssignee.');
    }
    if (canPatchAssigneeToJavaScript(this.valAssignee.node, this.options)) {
      this.valAssignee.patch();
      return null;
    } else {
      const assigneeName = this.claimFreeBinding('value');
      const assigneeCode = this.valAssignee.patchAndGetCode();
      this.overwrite(this.valAssignee.contentStart, this.valAssignee.contentEnd, assigneeName);
      return `${assigneeCode} = ${assigneeName}`;
    }
  }

  private isPostFor(): boolean {
    return this.body && this.body.contentStart < this.target.contentStart;
  }

  /**
   * Defensively wrap expressions in parens if they might contain a `then`
   * token, since that would mess up the parsing when we rearrange the for loop.
   *
   * This method can be subclassed to account for additional fields.
   */
  surroundThenUsagesInParens(): void {
    if (postfixExpressionRequiresParens(this.slice(this.target.contentStart, this.target.contentEnd))) {
      this.target.surroundInParens();
    }
    if (this.filter && postfixExpressionRequiresParens(this.slice(this.filter.contentStart, this.filter.contentEnd))) {
      this.filter.surroundInParens();
    }
  }

  private getForToken(): SourceToken {
    if (this.isPostFor()) {
      const afterForToken = this.getFirstHeaderPatcher();
      const index = this.indexOfSourceTokenBetweenPatchersMatching(
        this.body,
        afterForToken,
        (token) => token.type === SourceType.FOR,
      );
      if (!index) {
        throw this.error(`cannot find 'for' token in loop`);
      }
      return notNull(this.sourceTokenAtIndex(index));
    } else {
      const token = this.sourceTokenAtIndex(this.contentStartTokenIndex);

      if (!token || token.type !== SourceType.FOR) {
        throw this.error(`expected 'for' at start of loop`);
      }

      return token;
    }
  }

  private getFirstHeaderPatcher(): NodePatcher {
    const candidates = [this.keyAssignee, this.valAssignee, this.target];
    let result: NodePatcher | null = null;
    candidates.forEach((candidate) => {
      if (!candidate) {
        return;
      }
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
