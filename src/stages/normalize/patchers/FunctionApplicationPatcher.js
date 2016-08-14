import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { CALL_START, EXISTENCE, RBRACE, RBRACKET } from 'coffee-lex';

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

    if (this.isImplicitSuper()) {
      this.insert(this.fn.outerEnd, '(arguments...)');
      return;
    }

    if (implicitCall) {
      let firstArg = args[0];
      let hasOneArg = args.length === 1;
      let firstArgIsOnNextLine = !firstArg ? false :
        /[\r\n]/.test(this.context.source.slice(this.fn.outerEnd, firstArg.outerStart));
      let funcEnd = this.getFuncEnd();
      if ((hasOneArg && firstArg.node.virtual) || firstArgIsOnNextLine) {
        this.insert(funcEnd, '(');
      } else {
        this.overwrite(funcEnd, firstArg.outerStart, '(');
      }
    }

    args.forEach(arg => arg.patch());

    let lastTokenType = this.lastToken().type;
    if (implicitCall) {
      let lastArg = args[args.length - 1];
      if (lastArg.isMultiline() && lastTokenType !== RBRACE && lastTokenType !== RBRACKET) {
        this.insert(this.contentEnd, `\n${this.getIndent()})`);
      } else {
        this.insert(this.contentEnd, ')');
      }
    }
  }

  /**
   * Determine if parens need to be inserted. Needs to handle both `new`
   * expressions (which can be implicit calls with an empty argument lists) and
   * implicit soaked function calls (where there's a question mark between the
   * function and the args).
   */
  isImplicitCall(): boolean {
    let searchStart = this.fn.outerEnd;
    let searchEnd = this.args.length === 0 ? this.outerEnd : this.args[0].outerStart;
    return this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart, searchEnd, token => token.type === CALL_START) === null;
  }

  /**
   * Get the source index after the function and the question mark, if any.
   * This is the start of the region to insert an open-paren if necessary
   */
  getFuncEnd() {
    if (this.node.type === 'SoakedFunctionApplication') {
      let questionMarkTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        this.fn.outerEndTokenIndex, EXISTENCE);
      let questionMarkToken = this.sourceTokenAtIndex(questionMarkTokenIndex);
      return questionMarkToken.end;
    } else {
      return this.fn.outerEnd;
    }
  }

  isImplicitSuper(): boolean {
    if (this.fn.node.type !== 'Super') {
      return false;
    }

    if (this.args.length !== 1) {
      return false;
    }

    let arg = this.args[0].node;

    return (
      arg.virtual &&
      arg.type === 'Spread' &&
      arg.expression.type === 'Identifier' &&
      arg.expression.data === 'arguments'
    );
  }
}
