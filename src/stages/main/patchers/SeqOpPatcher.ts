import { SourceType, SourceToken } from 'coffee-lex';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';

/**
 * Handles sequence expressions/statements, e.g `a; b`.
 */
export default class SeqOpPatcher extends NodePatcher {
  left: NodePatcher;
  right: NodePatcher;

  negated = false;

  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
    this.left = left;
    this.right = right;
  }

  negate(): void {
    this.negated = !this.negated;
  }

  /**
   * LEFT ';' RIGHT
   */
  patchAsExpression(): void {
    this.left.setRequiresExpression();
    this.right.setRequiresExpression();

    if (this.negated) {
      this.insert(this.innerStart, '!(');
    }
    this.left.patch();

    const token = this.getOperatorToken();

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
  patchAsStatement(): void {
    this.left.patch();
    this.right.patch();
  }

  getOperatorToken(): SourceToken {
    const operatorTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.left,
      this.right,
      (token) => token.type === SourceType.SEMICOLON || token.type === SourceType.NEWLINE,
    );
    if (!operatorTokenIndex) {
      throw this.error('expected operator between binary operands');
    }
    return notNull(this.sourceTokenAtIndex(operatorTokenIndex));
  }

  statementNeedsParens(): boolean {
    return this.left.statementShouldAddParens();
  }
}
