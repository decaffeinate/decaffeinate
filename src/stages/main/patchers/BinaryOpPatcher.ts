import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';

export default class BinaryOpPatcher extends NodePatcher {
  left: NodePatcher;
  right: NodePatcher;
  // Avoid conflicting with the `negated` flag in some subclasses that have
  // special behavior.
  binaryOpNegated: boolean = false;

  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext);
    this.left = left;
    this.right = right;
  }

  initialize(): void {
    this.left.setRequiresExpression();
    if (!this.rhsMayBeStatement()) {
      this.right.setRequiresExpression();
    }
  }

  /**
   * Subclasses can override to avoid setting the RHS as an expression by default.
   */
  rhsMayBeStatement(): boolean {
    return false;
  }

  negate(): void {
    this.binaryOpNegated = !this.binaryOpNegated;
  }

  isPure(): boolean {
    return this.left.isPure() && this.right.isPure();
  }

  /**
   * LEFT OP RIGHT
   */
  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    let addParens = (needsParens && !this.isSurroundedByParentheses()) || this.binaryOpNegated;
    if (this.binaryOpNegated) {
      this.insert(this.innerStart, '!');
    }
    if (addParens) {
      this.insert(this.innerStart, '(');
    }
    if (this.left instanceof BinaryOpPatcher) {
      this.left.patch({ needsParens: this.getOperator() !== this.left.getOperator() });
    } else {
      this.left.patch({ needsParens: true });
    }
    this.patchOperator();
    if (this.right instanceof BinaryOpPatcher) {
      this.right.patch({ needsParens: this.getOperator() !== this.right.getOperator() });
    } else {
      this.right.patch({ needsParens: true });
    }
    if (addParens) {
      this.insert(this.innerEnd, ')');
    }
  }

  patchOperator(): void {
    // override point for subclasses
  }

  getOperator(): string {
    return this.sourceOfToken(this.getOperatorToken());
  }

  getOperatorToken(): SourceToken {
    let operatorTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.left,
      this.right,
      this.operatorTokenPredicate()
    );
    if (!operatorTokenIndex) {
      throw this.error('expected operator between binary operands');
    }
    return notNull(this.sourceTokenAtIndex(operatorTokenIndex));
  }

  /**
   * Subclasses may override this to provide a custom token predicate.
   */
  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === SourceType.OPERATOR || token.type === SourceType.EXISTENCE;
  }

  /**
   * IF `LEFT` needs parens then `LEFT + RIGHT` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.left.statementShouldAddParens();
  }
}
