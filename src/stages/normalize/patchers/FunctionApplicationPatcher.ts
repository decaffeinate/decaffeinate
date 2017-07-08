import { SourceType } from 'coffee-lex';

import SourceToken from 'coffee-lex/dist/SourceToken';
import { PatcherContext } from '../../../patchers/types';
import normalizeListItem from '../../../utils/normalizeListItem';
import NodePatcher from './../../../patchers/NodePatcher';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, fn: NodePatcher, args: Array<NodePatcher>) {
    super(patcherContext);
    this.fn = fn;
    this.args = args;
  }

  patchAsExpression(): void {
    let implicitCall = this.isImplicitCall();
    let { args } = this;

    this.fn.patch();

    if (implicitCall) {
      let firstArg = args[0];
      let firstArgIsOnNextLine = !firstArg ? false :
        /\n/.test(this.context.source.slice(this.fn.outerEnd, firstArg.outerStart));
      let funcEnd = this.getFuncEnd();
      if (firstArgIsOnNextLine) {
        this.insert(funcEnd, '(');
      } else {
        this.overwrite(funcEnd, firstArg.outerStart, '(');
      }
    }

    for (let [i, arg] of args.entries()) {
      arg.patch();
      normalizeListItem(this, arg, args[i + 1]);
    }

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
  insertImplicitCloseParen(): void {
    let argListCode = this.slice(
      this.args[0].contentStart, this.args[this.args.length - 1].contentEnd);
    let isArgListMultiline = argListCode.indexOf('\n') !== -1;
    let lastTokenType = this.lastToken().type;
    if (!isArgListMultiline || lastTokenType === SourceType.RBRACE || lastTokenType === SourceType.RBRACKET) {
      this.insert(this.contentEnd, ')');
      return;
    }

    let followingCloseParen = this.getFollowingCloseParenIfExists();
    if (followingCloseParen) {
      // In some cases, (e.g. within function args) our bounds are extended to
      // allow us to patch the close-paren all the way up to the start of the
      // following close-paren, but don't patch past the end of those bounds.
      this.insert(Math.min(followingCloseParen.start, this.getMaxCloseParenInsertPoint()), ')');
      return;
    }

    let { args } = this;
    let lastArg = args[args.length - 1];
    if (lastArg.isMultiline()) {
      // The CoffeeScript compiler will sometimes reject `.` that is starting a
      // new line following a `)` token. Also, in some cases, it will complain
      // about an indentation error if the `)` is too far indented. So handle
      // this case by moving the `.` to be right after the new `)`.
      let nextSemanticToken = this.getFirstSemanticToken(this.contentEnd);
      if (nextSemanticToken && nextSemanticToken.type === SourceType.DOT) {
        this.overwrite(this.outerEnd, nextSemanticToken.start, ')');
      } else {
        this.insert(this.contentEnd, `\n${this.getIndent()})`);
      }
      return;
    }

    this.insert(this.contentEnd, ')');
  }

  getFollowingCloseParenIfExists(): SourceToken | null {
    let tokenIndex = this.contentEndTokenIndex;
    let token;
    do {
      let nextTokenIndex = tokenIndex.next();
      if (nextTokenIndex === null) {
        return null;
      }
      tokenIndex = nextTokenIndex;
      token = this.sourceTokenAtIndex(tokenIndex);
      if (token === null) {
        return null;
      }
    } while (token.type === SourceType.NEWLINE);

    if (token.type === SourceType.CALL_END || token.type === SourceType.RPAREN) {
      return token;
    }
    return null;
  }

  /**
   * Normally we can edit up to the end of our editing bounds (but no further),
   * but be especially careful here to not place a close-paren before the
   * indentation level of our statement.
   */
  getMaxCloseParenInsertPoint(): number {
    let maxInsertionPoint = this.getEditingBounds()[1];
    let enclosingIndentedPatcher: NodePatcher = this;
    while (
        !enclosingIndentedPatcher.isFirstNodeInLine(enclosingIndentedPatcher.contentStart) &&
        enclosingIndentedPatcher.parent) {
      enclosingIndentedPatcher = enclosingIndentedPatcher.parent;
    }
    return Math.min(maxInsertionPoint, enclosingIndentedPatcher.contentEnd);
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
      searchStart, searchEnd, token => token.type === SourceType.CALL_START) === null;
  }

  /**
   * Get the source index after the function and the question mark, if any.
   * This is the start of the region to insert an open-paren if necessary
   */
  getFuncEnd(): number {
    if (this.node.type === 'SoakedFunctionApplication' || this.node.type === 'SoakedNewOp') {
      let questionMarkTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        this.fn.outerEndTokenIndex, SourceType.EXISTENCE);
      if (!questionMarkTokenIndex) {
        throw this.error('Expected to find question mark token index.');
      }
      let questionMarkToken = this.sourceTokenAtIndex(questionMarkTokenIndex);
      if (!questionMarkToken) {
        throw this.error('Expected to find question mark token.');
      }
      return questionMarkToken.end;
    } else {
      return this.fn.outerEnd;
    }
  }
}
