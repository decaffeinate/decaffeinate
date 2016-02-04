import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class MemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  patch() {
    this.expression.patch();
  }
}
