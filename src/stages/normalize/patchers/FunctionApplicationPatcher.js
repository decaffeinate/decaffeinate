import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { CALL_START, RBRACE, RBRACKET } from 'coffee-lex';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, fn: NodePatcher, args: Array<NodePatcher>) {
    super(node, context, editor);
    this.fn = fn;
    this.args = args;
  }

  patchAsExpression() {
    let implicitCall = this.isImplicitCall();
    let { args } = this;

    this.fn.patch();

    if (implicitCall && args.length === 0) {
      this.insert(this.fn.outerEnd, '()');
      return;
    }

    if (implicitCall) {
      let firstArg = args[0];
      let hasOneArg = args.length === 1;
      let firstArgIsOnNextLine = !firstArg ? false :
        /[\r\n]/.test(this.context.source.slice(this.fn.outerEnd, firstArg.outerStart));
      if ((hasOneArg && firstArg.node.virtual) || firstArgIsOnNextLine) {
        this.insert(this.fn.outerEnd, '(');
      } else {
        this.overwrite(this.fn.outerEnd, firstArg.outerStart, '(');
      }
    }

    args.forEach(arg => arg.patch());

    let lastTokenType = this.lastToken().type;
    if (implicitCall) {
      let lastArg = args[args.length - 1];
      if (lastArg.isMultiline() && lastTokenType !== RBRACE && lastTokenType !== RBRACKET) {
        this.insert(this.innerEnd, `\n${this.getIndent()})`);
      } else {
        this.insert(this.innerEnd, ')');
      }
    }
  }

  isImplicitCall() {
    return !this.fn.hasSourceTokenAfter(CALL_START);
  }
}
