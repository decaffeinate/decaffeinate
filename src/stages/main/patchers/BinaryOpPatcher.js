import NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, SourceType, Node, ParseContext, Editor } from './../../../patchers/types.js';
import { OPERATOR } from 'coffee-lex';

export default class BinaryOpPatcher extends NodePatcher {
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
    this.left.patch();
    this.right.patch();
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * @protected
   */
  getOperatorToken(): SourceToken {
    let expectedOperatorTokenType = this.expectedOperatorTokenType();
    let operatorTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.left,
      this.right,
      token => token.type === expectedOperatorTokenType
    );
    if (!operatorTokenIndex) {
      throw this.error('expected operator between binary operands');
    }
    return this.sourceTokenAtIndex(operatorTokenIndex);
  }

  /**
   * @protected
   */
  expectedOperatorTokenType(): SourceType {
    return OPERATOR;
  }
}
