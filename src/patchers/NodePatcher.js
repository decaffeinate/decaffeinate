import PatcherError from '../utils/PatchError';
import adjustIndent from '../utils/adjustIndent';
import { Token, Editor, Node, ParseContext } from './types';
import { logger } from '../utils/debug';

export default class NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor) {
    this.node = node;
    this.context = context;
    this.editor = editor;

    this.tokens = context.tokensForNode(node);
    this.setStatement(false);
    this.setupLocationInformation();

    this.log = logger(this.constructor.name);
  }

  /**
   * @private
   */
  setupLocationInformation() {
    let { node, context } = this;

    this.start = node.range[0];
    this.end = node.range[1];

    this.startTokenIndex = context.indexOfTokenAtOffset(this.start);
    this.lastTokenIndex = this.startTokenIndex + this.tokens.length - 1;

    let beforeTokenIndex = this.startTokenIndex;
    let afterTokenIndex = this.lastTokenIndex;

    for (;;) {
      let previousBeforeToken = context.tokenAtIndex(beforeTokenIndex - 1);
      let nextAfterToken = context.tokenAtIndex(afterTokenIndex + 1);

      if (!previousBeforeToken || previousBeforeToken.type !== '(') {
        break;
      }

      if (!nextAfterToken || nextAfterToken.type !== ')') {
        break;
      }

      beforeTokenIndex--;
      afterTokenIndex++;
    }

    this.before = context.tokenAtIndex(beforeTokenIndex).range[0];
    this.after = context.tokenAtIndex(afterTokenIndex).range[1];

    this.beforeTokenIndex = beforeTokenIndex;
    this.afterTokenIndex = afterTokenIndex;
  }

  /**
   * Called when the patcher tree is complete so we can do any processing that
   * requires communication with other patchers.
   *
   * @private
   */
  initialize() {}

  /**
   * Calls methods on `editor` to transform the source code represented by
   * `node` from CoffeeScript to JavaScript.
   */
  patch() {
    throw new Error('`patch` must be overridden in subclasses');
  }

  /**
   * Insert content at the start of `node`'s location.
   */
  insertAtStart(content: string) {
    this.insert(this.start, content);
  }

  /**
   * Insert content at the end of `node`'s location.
   */
  insertAtEnd(content: string) {
    this.insert(this.end, content);
  }

  /**
   * Inserts content before any punctuation for this node, i.e. parentheses.
   */
  insertBefore(content: string) {
    this.insert(this.before, content);
  }

  /**
   * Inserts content after any punctuation for this node, i.e. parentheses.
   */
  insertAfter(content: string) {
    this.insert(this.after, content);
  }

  /**
   * Insert content at the specified index.
   */
  insert(index: number, content: string) {
    this.log('INSERT', index, JSON.stringify(content));
    this.editor.insert(index, content);
  }

  /**
   * Replace the content between the start and end indexes with new content.
   */
  overwrite(start: number, end: number, content: string) {
    this.log(
      'OVERWRITE', `[${start}, ${end})`,
      JSON.stringify(this.context.source.slice(start, end)),
      '→', JSON.stringify(content)
    );
    this.editor.overwrite(start, end, content);
  }

  /**
   * Remove the content between the start and end indexes.
   */
  remove(start: number, end: number) {
    this.log(
      'REMOVE', `[${start}, ${end})`,
      JSON.stringify(this.context.source.slice(start, end))
    );
    this.editor.remove(start, end);
  }

  /**
   * Get the current content between the start and end indexes.
   */
  slice(start: number, end: number): string {
    return this.editor.slice(start, end);
  }

  /**
   * Determines whether this node starts with a string.
   */
  startsWith(string: string): boolean {
    return this.context.source.slice(this.start, this.start + string.length) === string;
  }

  /**
   * Determines whether this node ends with a string.
   */
  endsWith(string: string): boolean {
    return this.context.source.slice(this.end - string.length, this.end) === string;
  }

  /**
   * Gets whether this patcher is working on a statement or an expression.
   */
  isStatement(): boolean {
    return this._statement;
  }

  /**
   * Sets whether this patcher is working on a statement or an expression.
   */
  setStatement(statement: boolean) {
    this._statement = statement;
  }

  /**
   * Causes the node to be returned from its function.
   */
  return() {
    this.insertBefore('return ');
  }

  /**
   * Gets whether this patcher's node returns explicitly from its function.
   */
  returns() {
    return this._returns || false;
  }

  /**
   * Marks this patcher's as containing a node that explicitly returns.
   */
  setReturns() {
    this._returns = true;
    if (this.parent) {
      this.parent.setReturns();
    }
  }

  /**
   * Determines whether this patcher's node needs a semicolon after it. This
   * should be overridden in subclasses as appropriate.
   */
  statementNeedsSemicolon(): boolean {
    return true;
  }

  /**
   * Gets a token between left and right patchers' nodes matching type and data.
   */
  tokenBetweenPatchersMatching(left: NodePatcher, right: NodePatcher, type: string, data: ?string=null): ?Token {
    let tokens = this.context.tokensBetweenNodes(left.node, right.node);
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (token.type === type && (data === null || token.data === data)) {
        return token;
      }
    }
    return null;
  }

  /**
   * Determines whether this patcher's node is preceded by a particular token.
   * Note that this looks at the token immediately before the `before` offset.
   */
  hasTokenBefore(type: string, data: ?string=null): boolean {
    return this.hasTokenAtIndex(this.beforeTokenIndex - 1, type, data);
  }

  /**
   * Determines whether this patcher's node is preceded by a particular token.
   * Note that this looks at the token immediately after the `after` offset.
   */
  hasTokenAfter(type: string, data: ?string=null): boolean {
    return this.hasTokenAtIndex(this.afterTokenIndex + 1, type, data);
  }

  /**
   * Determines whether the token at index matches.
   */
  hasTokenAtIndex(index: number, type: string, data: ?string=null): boolean {
    let token = this.context.tokenAtIndex(index);
    if (!token) {
      return false;
    }
    if (token.type !== type) {
      return false;
    }
    if (data !== null) {
      return token.data === data;
    }
    return true;
  }

  /**
   * Determines whether a token is followed by another token.
   */
  hasTokenAfterToken(token: Token, type: string, data: ?string=null): boolean {
    return this.hasTokenAtIndex(this.context.tokens.indexOf(token) + 1, type, data);
  }

  /**
   * Determines whether this patcher's node is surrounded by parentheses.
   */
  isSurroundedByParentheses(): boolean {
    return (
      this.hasTokenAtIndex(this.beforeTokenIndex, '(') &&
      this.hasTokenAtIndex(this.afterTokenIndex, ')')
    );
  }

  /**
   * Negates this patcher's node when patching.
   */
  negate() {
    this.insertBefore('!');
  }

  /**
   * Gets the indent string for the line that starts this patcher's node.
   */
  getIndent(offset: number=0): string {
    return adjustIndent(this.context.source, this.start, offset);
  }

  /**
   * Gets the index ending the line following this patcher's node.
   *
   * @private
   */
  getEndOfLine(): number {
    let { source } = this.context;
    for (let i = this.after - '\n'.length; i < source.length; i++) {
      if (source[i] === '\n') {
        return i;
      }
    }
    return source.length;
  }

  /**
   * Appends the given content after the end of the current line.
   */
  appendLineAfter(content: string, indentOffset: number=0) {
    let eol = this.getEndOfLine();
    this.insert(eol, `\n${this.getIndent(indentOffset)}${content}`);
  }

  error(message: string, start: number=this.start, end: number=this.end): PatcherError {
    return new PatcherError(message, this, start, end);
  }
}
