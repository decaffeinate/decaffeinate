import { SourceType } from 'coffee-lex';
import NodePatcher from './../../../patchers/NodePatcher';
import type { SourceToken } from './../../../patchers/types';

/**
 * Handles sequence expressions/statements, e.g `a; b`.
 */
export default class SeqOpPatcher extends NodePatcher {
  left: NodePatcher;
  right: NodePatcher;

  negated: boolean = false;

  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
    this.left = left;
    this.right = right;
  }

  negate() {
    this.negated = !this.negated;
  }

  /**
   * LEFT ';' RIGHT
   */
  patchAsExpression() {
    this.left.setRequiresExpression();
    this.right.setRequiresExpression();

    if (this.negated) {
      this.insert(this.innerStart, '!(');
    }
    this.left.patch();

    let token = this.getOperatorToken();

    if (token.type === SourceType.SEMICOLON) {
      // `a; b` → `a, b`
      //   ^        ^
      this.overwrite(token.start, token.end, ',');
    } else if (token.type === SourceType.NEWLINE) {
      this.insert(this.left.outerEnd, ',');
    }

    this.right.patch();
    if (this.negated) {
      this.insert(this.innerEnd, ')');
    }
  }

  /**
   * If we're patching as a statement, we can just keep the semicolon or newline.
   */
  patchAsStatement() {
    this.left.patch();
    this.right.patch();
  }

  getOperatorToken(): SourceToken {
    let operatorTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.left,
      this.right,
      token => token.type === SourceType.SEMICOLON || token.type === SourceType.NEWLINE
    );
    if (!operatorTokenIndex) {
      throw this.error('expected operator between binary operands');
    }
    return this.sourceTokenAtIndex(operatorTokenIndex);
  }

  statementNeedsParens(): boolean {
    return this.left.statementShouldAddParens();
  }
}
