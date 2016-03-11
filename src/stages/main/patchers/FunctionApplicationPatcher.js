import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { CALL_START, COMMA } from 'coffee-lex';

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
      let arg = this.args.length === 1 ? this.args[0] : null;
      if (arg && arg.node.virtual) {
        this.insert(this.fn.after, '(');
      } else {
        this.overwrite(this.fn.after, this.args[0].before, '(');
      }
    }
    this.args.forEach((arg, i, args) => {
      arg.patch();
      if (i !== args.length - 1 && !arg.hasSourceTokenAfter(COMMA)) {
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
    return !this.fn.hasSourceTokenAfter(CALL_START);
  }
}
