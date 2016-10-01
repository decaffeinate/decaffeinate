import NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, Node, ParseContext, Editor } from './../../../patchers/types.js';
import { OPERATOR } from 'coffee-lex';

export default class BinaryOpPatcher extends NodePatcher {
  left: NodePatcher;
  right: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
  }

  initialize() {
    this.left.setRequiresExpression();
    this.right.setRequiresExpression();
  }

  /**
   * Binary operators have lower precedence than negation, so we need to add
   * parens.
   */
  negate() {
    this.insert(this.innerStart, '!(');
    this.insert(this.innerEnd, ')');
  }

  /**
   * LEFT OP RIGHT
   */
  patchAsExpression({ needsParens=false }={}) {
    let addParens = needsParens && !this.isSurroundedByParentheses();
    if (addParens) {
      this.insert(this.outerStart, '(');
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
      this.insert(this.outerEnd, ')');
    }
  }

  patchOperator() {
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
    return this.sourceTokenAtIndex(operatorTokenIndex);
  }

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    return (token: SourceToken) => token.type === OPERATOR;
  }

  /**
   * IF `LEFT` needs parens then `LEFT + RIGHT` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.left.statementShouldAddParens();
  }
}
