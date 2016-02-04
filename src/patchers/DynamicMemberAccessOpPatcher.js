import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class DynamicMemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this.indexingExpr = indexingExpr;
  }

  patch() {
    this.expression.patch();
    this.indexingExpr.patch();
  }
}
