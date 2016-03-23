import PatcherError from '../utils/PatchError.js';
import adjustIndent from '../utils/adjustIndent.js';
import repeat from 'repeating';
import type { SourceType, SourceToken, SourceTokenListIndex, Editor, Node, ParseContext, SourceTokenList } from './types.js';
import { LPAREN, RPAREN } from 'coffee-lex';
import { isSemanticToken } from '../utils/types.js';
import { logger } from '../utils/debug.js';

export default class NodePatcher {
  node: Node;
  context: ParseContext;
  editor: Editor;
  log: (...args: Array<any>) => void;
  parent: ?NodePatcher;

  contentStart: number;
  contentEnd: number;
  contentStartTokenIndex: SourceTokenListIndex;
  contentEndTokenIndex: SourceTokenListIndex;
  innerStart: number;
  innerEnd: number;
  innerStartTokenIndex: SourceTokenListIndex;
  innerEndTokenIndex: SourceTokenListIndex;
  outerStart: number;
  outerEnd: number;
  outerStartTokenIndex: SourceTokenListIndex;
  outerEndTokenIndex: SourceTokenListIndex;
  
  constructor(node: Node, context: ParseContext, editor: Editor) {
    this.log = logger(this.constructor.name);

    this.node = node;
    this.context = context;
    this.editor = editor;

    this.setupLocationInformation();
  }

  /**
   * Allow patcher classes to override the class used to patch their children.
   */
  static patcherClassForChildNode(/* node: Node, property: string */): ?Class<NodePatcher> {
    return null;
  }

  /**
   * Allow patcher classes that would patch a node to chose a different class.
   */
  static patcherClassOverrideForNode(node: Node): ?Class<NodePatcher> { // eslint-disable-line no-unused-vars
    return null;
  }

  /**
   * @private
   */
  setupLocationInformation() {
    let { node, context } = this;

    if (node.virtual) {
      return;
    }

    /**
     * `contentStart` and `contentEnd` is the exclusive range within the original source that
     * composes this patcher's node. For example, here's the contentStart and contentEnd of
     * `a + b` in the expression below:
     *
     *   console.log(a + b)
     *               ^    ^
     */
    this.contentStart = node.range[0];
    this.contentEnd = node.range[1];

    let tokens = context.sourceTokens;
    let firstSourceTokenIndex = tokens.indexOfTokenStartingAtSourceIndex(this.contentStart);
    let lastSourceTokenIndex = tokens.indexOfTokenEndingAtSourceIndex(this.contentEnd);

    this.contentStartTokenIndex = firstSourceTokenIndex;
    this.contentEndTokenIndex = lastSourceTokenIndex;

    let outerStartTokenIndex = firstSourceTokenIndex;
    let outerEndTokenIndex = lastSourceTokenIndex;

    let innerStartTokenIndex = firstSourceTokenIndex;
    let innerEndTokenIndex = lastSourceTokenIndex;

    for (;;) {
      let previousSurroundingTokenIndex = tokens.lastIndexOfTokenMatchingPredicate(
        isSemanticToken,
        outerStartTokenIndex.previous()
      );
      let nextSurroundingTokenIndex = tokens.indexOfTokenMatchingPredicate(
        isSemanticToken,
        outerEndTokenIndex.next()
      );

      if (!previousSurroundingTokenIndex || !nextSurroundingTokenIndex) {
        break;
      }

      let previousSurroundingToken = tokens.tokenAtIndex(previousSurroundingTokenIndex);
      let nextSurroundingToken = tokens.tokenAtIndex(nextSurroundingTokenIndex);

      if (!previousSurroundingToken || previousSurroundingToken.type !== LPAREN) {
        break;
      }

      if (!nextSurroundingToken || nextSurroundingToken.type !== RPAREN) {
        break;
      }

      if (innerStartTokenIndex === firstSourceTokenIndex) {
        innerStartTokenIndex = previousSurroundingTokenIndex;
      }

      if (innerEndTokenIndex === lastSourceTokenIndex) {
        innerEndTokenIndex = nextSurroundingTokenIndex;
      }

      outerStartTokenIndex = previousSurroundingTokenIndex;
      outerEndTokenIndex = nextSurroundingTokenIndex;
    }

    this.innerStartTokenIndex = innerStartTokenIndex;
    this.innerEndTokenIndex = innerEndTokenIndex;

    this.outerStartTokenIndex = outerStartTokenIndex;
    this.outerEndTokenIndex = outerEndTokenIndex;

    /**
     * `innerStart`, `innerEnd`, `outerStart` and `outerEnd` refer to the
     * positions around surrounding parentheses. In most nodes they are the same
     * as `contentStart` and `contentEnd`. For example:
     *
     *              innerStart
     *                  |
     *       outerStart | contentStart
     *                | | |
     *                ▼ ▼ ▼
     *            1 * ((  2 + 3  ))
     *                         ▲ ▲ ▲
     *                         | | |
     *                contentEnd | outerEnd
     *                           |
     *                        innerEnd
     */
    if (innerStartTokenIndex === firstSourceTokenIndex) {
      this.innerStart = this.contentStart;
    } else {
      this.innerStart = tokens.tokenAtIndex(innerStartTokenIndex).end;
    }
    if (innerEndTokenIndex === lastSourceTokenIndex) {
      this.innerEnd = this.contentEnd;
    } else {
      this.innerEnd = tokens.tokenAtIndex(innerEndTokenIndex).start;
    }
    this.outerStart = tokens.tokenAtIndex(outerStartTokenIndex).start;
    this.outerEnd = tokens.tokenAtIndex(outerEndTokenIndex).end;
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
   * `node` from CoffeeScript to JavaScript. By default this method delegates
   * to other patcher methods which can be overridden individually.
   */
  patch(options={}) {
    try {
      if (this.forcedToPatchAsExpression()) {
        this.patchAsForcedExpression(options);
      } else if (this.willPatchAsExpression()) {
        this.patchAsExpression(options);
      } else {
        this.patchAsStatement(options);
      }
    } catch (err) {
      if (!PatcherError.isA(err)) {
        throw this.error(
          err.message,
          this.contentStart,
          this.contentEnd,
          err
        );
      } else {
        throw err;
      }
    }
  }

  /**
   * Override this to patch the node as an expression.
   */
  patchAsExpression() {
    throw this.error(`'patchAsExpression' must be overridden in subclasses`);
  }

  /**
   * Override this to patch the node as a statement.
   */
  patchAsStatement() {
    throw this.error(`'patchAsStatement' must be overridden in subclasses`);
  }

  /**
   * Override this to patch the node as an expression that would not normally be
   * an expression, often by wrapping it in an immediately invoked function
   * expression (IIFE).
   */
  patchAsForcedExpression() {
    this.patchAsExpression();
  }

  /**
   * Insert content at the specified index.
   */
  insert(index: number, content: string) {
    if (typeof index !== 'number') {
      throw new Error(
        `cannot insert ${JSON.stringify(content)} at non-numeric index ${index}`
      );
    }
    this.log(
      'INSERT',
      index,
      JSON.stringify(content),
      'BEFORE',
      JSON.stringify(this.context.source.slice(index, index + 2))
    );

    this.adjustBoundsToInclude(index);
    this.editor.insert(index, content);
  }

  allowPatchingOuterBounds(): boolean {
    return false;
  }

  /**
   * @protected
   */
  getEditingBounds(): [number, number] {
    let boundingPatcher = this.getBoundingPatcher();
    if (this.allowPatchingOuterBounds()) {
      return [boundingPatcher.outerStart, boundingPatcher.outerEnd];
    } else {
      return [boundingPatcher.innerStart, boundingPatcher.innerEnd];
    }
  }

  /**
   * @protected
   */
  isIndexEditable(index: number): boolean {
    let [ start, end ] = this.getEditingBounds();
    return index >= start && index <= end;
  }

  /**
   * @protected
   */
  assertEditableIndex(index: number) {
    if (!this.isIndexEditable(index)) {
      let [ start, end ] = this.getEditingBounds();
      throw this.error(
        `cannot edit index ${index} because it is not editable (i.e. outside [${start}, ${end}))`,
        start,
        end
      );
    }
  }

  /**
   * When editing outside a node's bounds we expand the bounds to fit, if
   * possible. Note that if a node or a node's parent is wrapped in parentheses
   * we cannot adjust the bounds beyond the inside of the parentheses.
   *
   * @private
   */
  adjustBoundsToInclude(index: number) {
    this.assertEditableIndex(index);

    if (index < this.innerStart) {
      this.log('Moving `innerStart` from', this.innerStart, 'to', index);
      this.innerStart = index;
    }

    if (index > this.innerEnd) {
      this.log('Moving `innerEnd` from', this.innerEnd, 'to', index);
      this.innerEnd = index;
    }

    if (index < this.outerStart) {
      this.log('Moving `outerStart` from', this.outerStart, 'to', index);
      this.outerStart = index;
    }

    if (index > this.outerEnd) {
      this.log('Moving `outerEnd` from', this.outerEnd, 'to', index);
      this.outerEnd = index;
    }

    if (this.parent) {
      this.parent.adjustBoundsToInclude(index);
    }
  }

  /**
   * Replace the content between the start and end indexes with new content.
   */
  overwrite(start: number, end: number, content: string) {
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new Error(
        `cannot overwrite non-numeric range [${start}, ${end}) ` +
        `with ${JSON.stringify(content)}`
      );
    }
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
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new Error(
        `cannot remove non-numeric range [${start}, ${end})`
      );
    }
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
    return this.context.source.slice(this.contentStart, this.contentStart + string.length) === string;
  }

  /**
   * Determines whether this node ends with a string.
   */
  endsWith(string: string): boolean {
    return this.context.source.slice(this.contentEnd - string.length, this.contentEnd) === string;
  }

  /**
   * Tells us to force this patcher to generate an expression, or else throw.
   */
  setRequiresExpression() {
    this.setExpression(true);
  }

  /**
   * Tells us to try to patch as an expression, returning whether it can.
   */
  setExpression(force=false): boolean {
    if (force) {
      if (!this.canPatchAsExpression()) {
        throw this.error(`cannot represent ${this.node.type} as an expression`);
      }
    } else if (!this.prefersToPatchAsExpression()) {
      return false;
    }
    this._expression = true;
    return true;
  }

  /**
   * Override this to express whether the patcher prefers to be represented as
   * an expression. By default it's simply an alias for `canPatchAsExpression`.
   */
  prefersToPatchAsExpression(): boolean {
    return this.canPatchAsExpression();
  }

  /**
   * Override this if a node cannot be represented as an expression.
   */
  canPatchAsExpression(): boolean {
    return true;
  }

  /**
   * Gets whether this patcher is working on a statement or an expression.
   */
  willPatchAsExpression(): boolean {
    return this._expression;
  }

  /**
   * Gets whether this patcher was forced to patch its node as an expression.
   */
  forcedToPatchAsExpression(): boolean {
    return this.willPatchAsExpression() && !this.prefersToPatchAsExpression();
  }

  /**
   * Gets whether this patcher's node implicitly returns.
   */
  implicitlyReturns(): boolean {
    return this._implicitlyReturns || false;
  }

  /**
   * Causes the node to be returned from its function.
   */
  setImplicitlyReturns() {
    this._implicitlyReturns = true;
  }

  /**
   * Gets the ancestor that can make implicit returns explicit. Classes that
   * override this method should override `implicitReturnWillBreak`.
   */
  implicitReturnPatcher(): NodePatcher {
    return this.parent.implicitReturnPatcher();
  }

  /**
   * Patch the beginning of an implicitly-returned descendant.
   */
  patchImplicitReturnStart(patcher: NodePatcher) {
    patcher.setRequiresExpression();
    this.insert(patcher.outerStart, 'return ');
  }

  /**
   * Determines whether the implicit return code will stop execution of
   * statements in the current block. Classes that override this method should
   * also override `implicitReturnPatcher`.
   */
  implicitReturnWillBreak(): boolean {
    return this.parent.implicitReturnWillBreak();
  }

  /**
   * Patch the end of an implicitly-returned descendant.
   */
  patchImplicitReturnEnd(patcher: NodePatcher) { // eslint-disable-line no-unused-vars
    // Nothing to do.
  }

  /**
   * Gets whether this patcher's node returns explicitly from its function.
   */
  explicitlyReturns(): boolean {
    return this._returns || false;
  }

  /**
   * Marks this patcher's as containing a node that explicitly returns.
   */
  setExplicitlyReturns() {
    this._returns = true;
    if (this.parent) {
      this.parent.setExplicitlyReturns();
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
   * Gets the tokens for the whole program.
   */
  getProgramSourceTokens(): SourceTokenList {
    return this.context.sourceTokens;
  }

  /**
   * Gets the index of the token starting at a particular source index.
   */
  indexOfSourceTokenStartingAtSourceIndex(index: number): ?SourceTokenListIndex {
    return this.getProgramSourceTokens().indexOfTokenStartingAtSourceIndex(index);
  }

  /**
   * Gets the index of the token between left and right patchers that matches
   * a predicate function.
   */
  indexOfSourceTokenBetweenPatchersMatching(left: NodePatcher, right: NodePatcher, predicate: (token: SourceToken) => boolean): ?SourceTokenListIndex {
    let start = left.outerEnd;
    let end = right.outerStart;
    return this.getProgramSourceTokens().indexOfTokenMatchingPredicate(token => {
      return (
        token.start >= start &&
        token.start <= end &&
        predicate(token)
      );
    });
  }

  /**
   * Gets the token at a particular index.
   */
  sourceTokenAtIndex(index: SourceTokenListIndex): ?SourceToken {
    return this.getProgramSourceTokens().tokenAtIndex(index);
  }

  /**
   * Gets the source encompassed by the given token.
   */
  sourceOfToken(token: SourceToken): string {
    return this.context.source.slice(token.start, token.end);
  }

  /**
   * Gets the original source of this patcher's node.
   */
  getOriginalSource(): string {
    return this.context.source.slice(this.contentStart, this.contentEnd);
  }

  /**
   * Gets the patched source of this patcher's node.
   */
  getPatchedSource(): string {
    return this.slice(this.contentStart, this.contentEnd);
  }

  /**
   * Gets the index of a token after `contentStart` with the matching type, ignoring
   * non-semantic types by default.
   */
  indexOfSourceTokenAfterSourceTokenIndex(start: SourceTokenListIndex, type: SourceType, predicate: (token: SourceToken) => boolean=isSemanticToken): ?SourceTokenListIndex {
    let index = this.getProgramSourceTokens()
      .indexOfTokenMatchingPredicate(predicate, start.next());
    if (!index) {
      return null;
    }
    let token = this.sourceTokenAtIndex(index);
    if (!token || token.type !== type) {
      return null;
    }
    return index;
  }

  /**
   * Determines whether this patcher's node is followed by a particular token.
   */
  hasSourceTokenAfter(type: SourceType, predicate: (token: SourceToken) => boolean=isSemanticToken): boolean {
    return this.indexOfSourceTokenAfterSourceTokenIndex(this.outerEndTokenIndex, type, predicate) !== null;
  }

  /**
   * Determines whether this patcher's node is surrounded by parentheses.
   */
  isSurroundedByParentheses(): boolean {
    let beforeToken = this.sourceTokenAtIndex(this.outerStartTokenIndex);
    let afterToken = this.sourceTokenAtIndex(this.outerEndTokenIndex);
    return (
      beforeToken && beforeToken.type === LPAREN &&
      afterToken && afterToken.type === RPAREN
    );
  }

  getBoundingPatcher(): ?NodePatcher {
    if (this.isSurroundedByParentheses()) {
      return this;
    } else if (this.parent) {
      return this.parent.getBoundingPatcher();
    } else {
      return this;
    }
  }

  /**
   * Negates this patcher's node when patching.
   */
  negate() {
    this.insert(this.outerStart, '!');
  }

  /**
   * Gets the indent string for the line that starts this patcher's node.
   */
  getIndent(offset: number=0): string {
    return adjustIndent(this.context.source, this.contentStart, offset);
  }

  /**
   * Gets the indent string used for each indent in this program.
   */
  getProgramIndentString(): string {
    return this.parent.getProgramIndentString();
  }

  /**
   * Indent this node a number of times. To unindent, pass a negative number.
   *
   * Note that because this method inserts indents immediately before the first
   * non-whitespace character of each line in the node's source, it should be
   * called *before* any other editing is done to the node's source to ensure
   * that strings inserted before child nodes appear after the indent, not
   * before.
   */
  indent(offset: number=1) {
    if (offset === 0) {
      return;
    }

    let indentString = this.getProgramIndentString();
    let indentToChange = repeat(indentString, Math.abs(offset));
    let start = this.outerStart;
    let end = this.outerEnd;
    let { source } = this.context;
    let hasIndentedThisLine = false;

    for (let i = start; i < end; i++) {
      switch (source[i]) {
        case '\n':
        case '\r':
          hasIndentedThisLine = false;
          break;

        case ' ':
        case '\t':
          break;

        default:
          if (!hasIndentedThisLine) {
            if (offset > 0) {
              this.insert(i, indentToChange);
            } else if (source.slice(i - indentToChange.length, i) === indentToChange) {
              this.remove(i - indentToChange.length, i);
            } else {
              throw this.error(
                `cannot unindent line by ${offset} without enough indent`,
                i - indentToChange.length,
                i
              );
            }
            hasIndentedThisLine = true;
          }
          break;
      }
    }
  }

  /**
   * Gets the index ending the line following this patcher's node.
   *
   * @private
   */
  getEndOfLine(): number {
    let { source } = this.context;
    for (let i = this.outerEnd - '\n'.length; i < source.length; i++) {
      if (source[i] === '\n') {
        return i;
      }
    }
    return source.length;
  }

  /**
   * Appends the given content on a new line after the end of the current line.
   */
  appendLineAfter(content: string, indentOffset: number=0) {
    let boundingPatcher = this.getBoundingPatcher();
    let endOfLine = this.getEndOfLine();
    this.insert(
      Math.min(endOfLine, boundingPatcher.innerEnd),
      `\n${this.getIndent(indentOffset)}${content}`
    );
  }

  /**
   * Appends the given content at the end of the current line.
   */
  appendToEndOfLine(content: string) {
    let eol = this.getEndOfLine();
    this.insert(eol, content);
  }

  /**
   * Generate an error referring to a particular section of the source.
   */
  error(message: string, start: number=this.contentStart, end: number=this.contentEnd, error: ?Error=null): PatcherError {
    return new PatcherError(message, this.context, start, end, error);
  }

  /**
   * Register a helper to be reused in several places.
   */
  registerHelper(name: string, code: string): string {
    return this.parent.registerHelper(name, code);
  }

  /**
   * Determines whether this node can be repeated without side-effects. Most
   * nodes are not repeatable, so that is the default. Subclasses should
   * override this to indicate whether they are repeatable without any changes.
   */
  isRepeatable(): boolean {
    return false;
  }

  /**
   * Alter this node to enable it to be repeated without side-effects. Though
   * a default implementation is provided, subclasses should override this to
   * provide a more appropriate version for their particular node type.
   */
  makeRepeatable(parens: boolean, ref: ?string=null): string {
    if (this.isRepeatable()) {
      // If we can repeat it, just return the original source.
      return this.getOriginalSource();
    } else {
      // Can't repeat it, so we assign it to a free variable and return that,
      // i.e. `a + b` → `(ref = a + b)`.
      if (parens) {
        this.insert(this.innerStart, '(');
      }
      ref = this.claimFreeBinding(ref);
      this.insert(this.innerStart, `${ref} = `);
      if (parens) {
        this.insert(this.innerEnd, ')');
      }
      return ref;
    }
  }

  /**
   * Claim a binding that is unique in the current scope.
   */
  claimFreeBinding(ref: string|Array<string>='ref'): string {
    return this.node.scope.claimFreeBinding(this.node, ref);
  }

  /**
   * Determines whether all the possible code paths in this node are present.
   */
  allCodePathsPresent(): boolean {
    return true;
  }
}
