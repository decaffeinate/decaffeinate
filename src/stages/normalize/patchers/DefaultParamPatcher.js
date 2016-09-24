import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class DefaultParamPatcher extends PassthroughPatcher {
  param: NodePatcher;
  value: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, param: NodePatcher, value: NodePatcher) {
    super(node, context, editor, param, value);
    this.param = param;
    this.value = value;
  }
}
