import NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

export default class FunctionApplicationPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, fn: NodePatcher, args: Array<NodePatcher>) {
    super(node, context, editor);
    this.fn = fn;
    this.args = args;
  }

  initialize() {
    this.fn.setRequiresExpression();
    this.args.forEach(arg => arg.setRequiresExpression());
  }

  patch() {
    let implicitCall = this.isImplicitCall();
    this.fn.patch();
    if (implicitCall) {
      this.overwrite(this.fn.after, this.args[0].before, '(');
    }
    this.args.forEach(arg => arg.patch());
    if (implicitCall) {
      this.insertAfter(')');
    }
  }

  isImplicitCall() {
    return !this.fn.hasTokenAfter('CALL_START');
  }
}
