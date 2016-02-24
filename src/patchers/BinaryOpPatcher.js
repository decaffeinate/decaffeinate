import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

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
  getOperatorToken(): Token {
    let tokens = this.context.tokensBetweenNodes(
      this.left.node,
      this.right.node
    );
    while (tokens[0] && tokens[0].type === ')') {
      tokens.shift();
    }
    while (tokens[tokens.length - 1] && tokens[tokens.length - 1].type === '(') {
      tokens.pop();
    }
    if (tokens.length !== 1) {
      throw this.error('expected operator between binary operands');
    }
    return tokens[0];
  }
}
