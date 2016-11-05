import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { CALL_START, CALL_END, EXISTENCE, NEWLINE, RBRACE, RBRACKET, RPAREN } from 'coffee-lex';

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


    if (implicitCall) {
      this.insertImplicitCloseParen();
    }
  }

  /**
   * We need to be careful when inserting the close-paren after a function call,
   * since an incorrectly-placed close-paren can cause a parsing error in the
   * MainStage due to subtle indentation rules in the CoffeeScript parser.
   *
   * In particular, we prefer to place the close paren after an existing } or ],
   * or before an existing ), if we can, since that is least likely to confuse
   * any indentation parsing. But in some cases it's best to instead insert the
   * close-paren properly-indented on its own line.
   */
  insertImplicitCloseParen() {
    let lastTokenType = this.lastToken().type;
    if (!this.isMultiline() || lastTokenType === RBRACE || lastTokenType === RBRACKET) {
      this.insert(this.contentEnd, ')');
      return;
    }

    let followingCloseParen = this.getFollowingCloseParenIfExists();
    if (followingCloseParen) {
      this.insert(followingCloseParen.start, ')');
      return;
    }

    let { args } = this;
    let lastArg = args[args.length - 1];
    if (lastArg.isMultiline()) {
      this.insert(this.contentEnd, `\n${this.getIndent()})`);
      return;
    }

    this.insert(this.contentEnd, ')');
  }

  getFollowingCloseParenIfExists() {
    let tokenIndex = this.contentEndTokenIndex;
    let token;
    do {
      tokenIndex = tokenIndex.next();
      if (tokenIndex === null) {
        return null;
      }
      token = this.sourceTokenAtIndex(tokenIndex);
      if (token === null) {
        return null;
      }
    } while (token.type === NEWLINE);

    if (token.type === CALL_END || token.type === RPAREN) {
      return token;
    }
    return null;
  }

  /**
   * Determine if parens need to be inserted. Needs to handle implicit soaked
   * function calls (where there's a question mark between the function and the
   * args).
   *
   * Note that we do not add parentheses for constructor invocations with no
   * arguments and no parentheses; that usage is correct in JavaScript, so we
   * leave it as-is.
   */
  isImplicitCall(): boolean {
    if (this.args.length === 0) {
      return false;
    }
    let searchStart = this.fn.outerEnd;
    let searchEnd = this.args[0].outerStart;
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
