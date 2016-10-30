import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class AssignOpPatcher extends PassthroughPatcher {
  key: NodePatcher;
  expression: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, key: NodePatcher, expression: NodePatcher) {
    super(node, context, editor, key, expression);
    this.key = key;
    this.expression = expression;
  }
}
