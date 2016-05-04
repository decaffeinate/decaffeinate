import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { CALL_START, COMMA } from 'coffee-lex';
import { isSemanticToken } from '../../../utils/types.js';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

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

    args.forEach((arg, i) => {
      arg.patch();
      let isLast = i === args.length - 1;
      let commaTokenIndex = arg.node.virtual ? null : this.indexOfSourceTokenAfterSourceTokenIndex(
        arg.outerEndTokenIndex,
        COMMA,
        isSemanticToken
      );
      let commaToken = commaTokenIndex && this.sourceTokenAtIndex(commaTokenIndex);
      if (isLast && commaToken) {
        this.remove(arg.outerEnd, commaToken.end);
      } else if (!isLast && !commaToken) {
        this.insert(arg.outerEnd, ',');
      }
    });

    if (implicitCall) {
      this.insert(this.innerEnd, ')');
    }
  }

  isImplicitCall() {
    return !this.fn.hasSourceTokenAfter(CALL_START);
  }

  /**
   * Probably can't happen, but just for completeness.
   */
  statementNeedsParens(): boolean {
    return this.fn.statementShouldAddParens();
  }
}
