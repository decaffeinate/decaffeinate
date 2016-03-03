import NodePatcher from './NodePatcher.js';
import type { Editor, Node, ParseContext } from './types.js';

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

  patchAsExpression() {
    let implicitCall = this.isImplicitCall();
    this.fn.patch();
    if (implicitCall) {
      this.overwrite(this.fn.after, this.args[0].before, '(');
    }
    this.args.forEach((arg, i, args) => {
      arg.patch();
      if (i !== args.length - 1 && !arg.hasTokenAfter(',')) {
        this.insert(arg.after, ',');
      }
    });
    if (implicitCall) {
      this.insertAfter(')');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  isImplicitCall() {
    return !this.fn.hasTokenAfter('CALL_START');
  }
}
