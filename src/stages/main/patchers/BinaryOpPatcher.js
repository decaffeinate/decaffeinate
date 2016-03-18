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
   * LEFT OP RIGHT
   */
  patchAsExpression() {
    this.left.patch({ needsParens: true });
    this.right.patch({ needsParens: true });
  }

  patchAsStatement() {
    this.patchAsExpression();
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
}
