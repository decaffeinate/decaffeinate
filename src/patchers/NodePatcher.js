import { Editor, Node, ParseContext } from './types';

export default class NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor) {
    this.node = node;
    this.context = context;
    this.editor = editor;

    this.tokens = context.tokensForNode(node);
    this.setStatement(false);
    this.setupLocationInformation();
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
    this.editor.insert(index, content);
  }

  /**
   * Replace the content between the start and end indexes with new content.
   */
  overwrite(start: number, end: number, content: string) {
    this.editor.overwrite(start, end, content);
  }

  /**
   * Remove the content between the start and end indexes.
   */
  remove(start: number, end: number) {
    this.editor.remove(start, end);
  }

  /**
   * Get the current content between the start and end indexes.
   */
  slice(start: number, end: number): string {
    return this.editor.slice(start, end);
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
  setStatement(statement) {
    this._statement = statement;
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
   * Determines whether this patcher's node is preceded by a particular token.
   * Note that this looks at the token immediately before the `before` offset.
   */
  hasTokenBefore(type: string, data: ?string=null): boolean {
    let token = this.context.tokenAtIndex(this.beforeTokenIndex - 1);
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
   * Determines whether this patcher's node is preceded by a particular token.
   * Note that this looks at the token immediately after the `after` offset.
   */
  hasTokenAfter(type: string, data: ?string=null): boolean {
    let token = this.context.tokenAtIndex(this.lastTokenIndex + 1);
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
}
