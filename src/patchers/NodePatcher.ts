import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import {
  FunctionApplication, Identifier, NewOp, Node, SoakedFunctionApplication
} from 'decaffeinate-parser/dist/nodes';
import MagicString from 'magic-string';
import { Options } from '../options';
import {
  AVOID_IIFES,
  AVOID_INLINE_ASSIGNMENTS,
  CLEAN_UP_IMPLICIT_RETURNS, Suggestion
} from '../suggestions';
import adjustIndent from '../utils/adjustIndent';
import { logger } from '../utils/debug';
import DecaffeinateContext from '../utils/DecaffeinateContext';
import notNull from '../utils/notNull';
import PatcherError from '../utils/PatchError';
import Scope from '../utils/Scope';
import traverse from '../utils/traverse';
import { isFunction, isSemanticToken } from '../utils/types';
import { PatcherContext, PatchOptions, RepeatableOptions } from './types';

export default class NodePatcher {
  node: Node;
  context: DecaffeinateContext;
  editor: MagicString;
  options: Options;
  addSuggestion: (suggestion: Suggestion) => void;
  log: (...args: Array<{}>) => void;
  parent: NodePatcher | null;

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

  adjustedIndentLevel: number = 0;
  _assignee: boolean = false;
  _containsYield: boolean = false;
  _deferredSuffix: string = '';
  _expression: boolean = false;
  _hadUnparenthesizedNegation: boolean = false;
  _implicitlyReturns: boolean = false;
  _repeatableOptions: RepeatableOptions | null = null;
  _repeatCode: string | null = null;
  _returns: boolean = false;

  constructor({node, context, editor, options, addSuggestion}: PatcherContext) {
    this.log = logger(this.constructor.name);

    this.node = node;
    this.context = context;
    this.editor = editor;
    this.options = options;
    this.addSuggestion = addSuggestion;

    this.withPrettyErrors(() => this.setupLocationInformation());
  }

  /**
   * Allow patcher classes to override the class used to patch their children.
   */
  static patcherClassForChildNode(/* node: Node, property: string */): typeof NodePatcher | null {
    return null;
  }

  /**
   * Allow patcher classes that would patch a node to chose a different class.
   */
  static patcherClassOverrideForNode(_node: Node): typeof NodePatcher | null { // eslint-disable-line no-unused-vars
    return null;
  }

  /**
   * @private
   */
  setupLocationInformation(): void {
    let { node, context } = this;

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

    if (this.shouldTrimContentRange()) {
      this.trimContentRange();
    }

    let tokens = context.sourceTokens;
    let firstSourceTokenIndex = tokens.indexOfTokenStartingAtSourceIndex(this.contentStart);
    let lastSourceTokenIndex = tokens.indexOfTokenEndingAtSourceIndex(this.contentEnd);

    if (!firstSourceTokenIndex || !lastSourceTokenIndex) {
      if (node.type === 'Program') {
        // Just an empty program.
        return;
      }

      throw this.error(`cannot find first or last token in ${node.type} node`);
    }

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

      if (!previousSurroundingToken || (previousSurroundingToken.type !== SourceType.LPAREN && previousSurroundingToken.type !== SourceType.CALL_START)) {
        break;
      }

      if (!nextSurroundingToken || (nextSurroundingToken.type !== SourceType.RPAREN && nextSurroundingToken.type !== SourceType.CALL_END)) {
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
      this.innerStart = notNull(tokens.tokenAtIndex(innerStartTokenIndex)).end;
    }
    if (innerEndTokenIndex === lastSourceTokenIndex) {
      this.innerEnd = this.contentEnd;
    } else {
      this.innerEnd = notNull(tokens.tokenAtIndex(innerEndTokenIndex)).start;
    }
    this.outerStart = notNull(tokens.tokenAtIndex(outerStartTokenIndex)).start;
    this.outerEnd = notNull(tokens.tokenAtIndex(outerEndTokenIndex)).end;
  }

  /**
   * Called to trim the range of content for this node. Override in subclasses
   * to customize its behavior, or override `shouldTrimContentRange` to enable
   * or disable it.
   */
  trimContentRange(): void {
    let context = this.context;

    for (;;) {
      let startChar = context.source[this.contentStart];

      if (startChar === ' ' || startChar === '\t') {
        this.contentStart++;
      } else {
        break;
      }
    }

    for (;;) {
      let lastChar = context.source[this.contentEnd - 1];

      if (lastChar === ' ' || lastChar === '\t') {
        this.contentEnd--;
      } else {
        break;
      }
    }
  }

  /**
   * Decides whether to trim the content range of this node.
   */
  shouldTrimContentRange(): boolean {
    return false;
  }

  /**
   * Called when the patcher tree is complete so we can do any processing that
   * requires communication with other patchers.
   */
  initialize(): void {}

  /**
   * Calls methods on `editor` to transform the source code represented by
   * `node` from CoffeeScript to JavaScript. By default this method delegates
   * to other patcher methods which can be overridden individually.
   */
  patch(options: PatchOptions = {}): void {
    this.withPrettyErrors(() => {
      if (this._repeatableOptions !== null) {
        this._repeatCode = this.patchAsRepeatableExpression(
          this._repeatableOptions, options);
      } else if (this.forcedToPatchAsExpression()) {
        this.patchAsForcedExpression(options);
        this.commitDeferredSuffix();
      } else if (this.willPatchAsExpression()) {
        this.patchAsExpression(options);
        this.commitDeferredSuffix();
      } else {
        this.patchAsStatement(options);
        this.commitDeferredSuffix();
      }
    });
  }

  /**
   * Alternative to patch that patches the expression in a way that the result
   * can be referenced later, then returns the code to reference it.
   *
   * This is a shorthand for the simplest use of the repeatable protocol. In
   * more advanced cases (such as repeating code that is deep within the AST),
   * setRequiresRepeatableExpression can be called before the node is patched
   * and getRepeatCode can be called any time after.
   *
   * The actual implementation for making the node repeatable should be in
   * patchAsRepeatableExpression.
   */
  patchRepeatable(repeatableOptions: RepeatableOptions = {}): string {
    this.setRequiresRepeatableExpression(repeatableOptions);
    this.patch();
    return this.getRepeatCode();
  }

  /**
   * Patch the given expression and get the underlying generated code. This is
   * more robust than calling patch and slice directly, since it also includes
   * code inserted at contentStart (which normally isn't picked up by slice
   * because it's inserted to the left of the index boundary). To accomplish
   * this, we look at the range from contentStart - 1 to contentStart before and
   * after patching and include anything new that was added.
   */
  patchAndGetCode(options: PatchOptions = {}): string {
    return this.captureCodeForPatchOperation(() => this.patch(options));
  }

  captureCodeForPatchOperation(patchFn: () => void): string {
    let sliceStart = this.contentStart > 0 ? this.contentStart - 1 : 0;
    // Occasionally, sliceStart will be illegal because it will be in a range
    // that has been removed or overwritten. If that's the case, subtract 1 from
    // sliceStart until we find something that works.
    let beforeCode = null;
    while (beforeCode === null) {
      try {
        beforeCode = this.slice(sliceStart, this.contentStart);
      } catch(e) {
        // Assume that this is because the index is an invalid start. It looks
        // like there isn't a robust way to detect this case exactly, so just
        // try a lower start for any error.
        sliceStart -= 1;
        if (sliceStart < 0) {
          throw this.error('Could not find a valid index to slice for patch operation.');
        }
      }
    }
    patchFn();
    let code = this.slice(sliceStart, this.contentEnd);
    let startIndex = 0;
    while (startIndex < beforeCode.length &&
        startIndex < code.length &&
        beforeCode[startIndex] === code[startIndex]) {
      startIndex++;
    }
    return code.substr(startIndex);
  }

  /**
   * Catch errors and throw them again annotated with the current node.
   */
  withPrettyErrors(body: () => void): void {
    try {
      body();
    } catch (err) {
      if (!PatcherError.detect(err)) {
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
   * Internal patching method that should patch the current node as an
   * expression and also, if necessary, alter it in a way that it can
   *
   * The return value of this function should be a code snippet that references
   * the result of this expression without any further side-effects.
   *
   * In simple cases, such as identifiers, subclasses can override isRepeatable
   * to declare themselves as already repeatable. In more advanced cases,
   * subclasses can override this method to provide custom behavior.
   *
   * This function is also responsible for committing the deferred suffix if
   * necessary.
   *
   * @protected
   */
  patchAsRepeatableExpression(
      repeatableOptions: RepeatableOptions = {}, patchOptions: PatchOptions = {}): string {
    if (this.isRepeatable() && !repeatableOptions.forceRepeat) {
      return this.captureCodeForPatchOperation(() => {
        this.patchAsForcedExpression(patchOptions);
        this.commitDeferredSuffix();
      });
    } else {
      this.addSuggestion(AVOID_INLINE_ASSIGNMENTS);
      // Can't repeat it, so we assign it to a free variable and return that,
      // i.e. `a + b` → `(ref = a + b)`.
      if (repeatableOptions.parens) {
        this.insert(this.innerStart, '(');
      }
      let ref = this.claimFreeBinding(repeatableOptions.ref);
      this.insert(this.innerStart, `${ref} = `);
      this.patchAsForcedExpression(patchOptions);
      this.commitDeferredSuffix();
      if (repeatableOptions.parens) {
        this.insert(this.innerEnd, ')');
      }
      return ref;
    }
  }

  /**
   * Override this to patch the node as an expression.
   */
  patchAsExpression(_options: PatchOptions = {}): void {
    throw this.error(`'patchAsExpression' must be overridden in subclasses`);
  }

  /**
   * Override this to patch the node as a statement.
   */
  patchAsStatement(options: PatchOptions = {}): void {
    let addParens = this.statementShouldAddParens();
    if (addParens) {
      this.insert(this.outerStart, '(');
    }
    this.patchAsExpression(options);
    if (addParens) {
      this.insert(this.outerEnd, ')');
    }
  }

  /**
   * Override this to patch the node as an expression that would not normally be
   * an expression, often by wrapping it in an immediately invoked function
   * expression (IIFE).
   */
  patchAsForcedExpression(options: PatchOptions = {}): void {
    this.patchAsExpression(options);
  }

  /**
   * Insert content at the specified index.
   */
  insert(index: number, content: string): void {
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
      JSON.stringify(this.context.source.slice(index, index + 8))
    );

    this.adjustBoundsToInclude(index);
    this.editor.appendLeft(index, content);
  }

  /**
   * Insert content at the specified index, before any content normally
   * specified with `insert`. Note that this should be used sparingly. In almost
   * every case, the correct behavior is to do all patching operations in order
   * and always use `insert`. However, in some cases (like a constructor that
   * needs the patched contents of the methods below it), we need to do patching
   * out of order, so it's ok to use `prependLeft` to ensure that the code ends
   * up before the later values.
   */
  prependLeft(index: number, content: string): void {
    if (typeof index !== 'number') {
      throw new Error(
        `cannot insert ${JSON.stringify(content)} at non-numeric index ${index}`
      );
    }
    this.log(
      'PREPEND LEFT',
      index,
      JSON.stringify(content),
      'BEFORE',
      JSON.stringify(this.context.source.slice(index, index + 8))
    );

    this.adjustBoundsToInclude(index);
    this.editor.prependLeft(index, content);
  }

  allowPatchingOuterBounds(): boolean {
    return false;
  }

  /**
   * @protected
   */
  getEditingBounds(): [number, number] {
    let boundingPatcher = this.getBoundingPatcher();
    // When we're a function arg, there isn't a great patcher to use to
    // determine our bounds (we're allowed to patch from the previous
    // comma/paren to the next comma/paren), so loosen the restriction to the
    // entire function.
    if (boundingPatcher.parent &&
        (this.isNodeFunctionApplication(boundingPatcher.parent.node) ||
        boundingPatcher.parent.node.type === 'ArrayInitialiser')) {
      boundingPatcher = boundingPatcher.parent;
    }
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
  assertEditableIndex(index: number): void {
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
   */
  adjustBoundsToInclude(index: number): void {
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
  overwrite(start: number, end: number, content: string): void {
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
  remove(start: number, end: number): void {
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
   * Moves content in a range to another index.
   */
  move(start: number, end: number, index: number): void {
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw this.error(
        `cannot remove non-numeric range [${start}, ${end})`
      );
    }
    if (typeof index !== 'number') {
      throw this.error(
        `cannot move to non-numeric index: ${index}`
      );
    }
    this.log(
      'MOVE', `[${start}, ${end}) → ${index}`,
      JSON.stringify(this.context.source.slice(start, end)),
      'BEFORE', JSON.stringify(this.context.source.slice(index, index + 8))
    );
    this.editor.move(start, end, index);
  }

  /**
   * Get the current content between the start and end indexes.
   */
  slice(start: number, end: number): string {
    // magic-string treats 0 as the end of the string, which we don't want to do.
    if (end === 0) {
      return '';
    }
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
  setRequiresExpression(): void {
    this.setExpression(true);
  }

  /**
   * Tells us to try to patch as an expression, returning whether it can.
   */
  setExpression(force: boolean = false): boolean {
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
   * Marks this node as an assignee. Nested assignees, like destructure
   * operations, should override this method and propagate it to the children.
   */
  setAssignee(): void {
    this._assignee = true;
  }

  /**
   * Checks if this node has been marked as an assignee. This is particularly
   * useful for distinguishing rest from spread operations.
   */
  isAssignee(): boolean {
    return this._assignee;
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
  setImplicitlyReturns(): void {
    this._implicitlyReturns = true;
  }

  /**
   * Gets the ancestor that will decide the current implicit return behavior.
   * That ancestor will then have implicitReturnWillBreak,
   * patchImplicitReturnStart, and patchImplicitReturnEnd methods that describe
   * how to handle expressions in an implicit return position (usually they are
   * just returned, but in the case of loop IIFEs, they will be added to a
   * list).
   */
  implicitReturnPatcher(): NodePatcher {
    if (this.canHandleImplicitReturn()) {
      return this;
    } else {
      return notNull(this.parent).implicitReturnPatcher();
    }
  }

  /**
   * Subclasses should return true to declare themselves as the "handler" in an
   * implicit return situation.
   */
  canHandleImplicitReturn(): boolean {
    return false;
  }

  /**
   * Determines whether the current patcher (which has already declared that it
   * can be an implicit return patcher) will generate code that stops execution
   * in the current block. In the normal case of a return statement, this is
   * true, but in loop IIFEs, there might be e.g. an assignment, which means
   * that the control flow won't necessarily stop.
   */
  implicitReturnWillBreak(): boolean {
    return true;
  }

  /**
   * Patch the beginning of an implicitly-returned descendant. Unlike most
   * statements, implicitly-returned statements will not have their surrounding
   * parens removed, so the implicit return patching may need to remove
   * surrounding parens.
   */
  patchImplicitReturnStart(patcher: NodePatcher): void {
    if (patcher.node.type === 'Break' || patcher.node.type === 'Continue') {
      if (patcher.isSurroundedByParentheses()) {
        this.remove(patcher.outerStart, patcher.innerStart);
        this.remove(patcher.innerEnd, patcher.outerEnd);
      }
      return;
    }
    if (isFunction(this.node) && this.isMultiline()) {
      this.addSuggestion(CLEAN_UP_IMPLICIT_RETURNS);
    }
    patcher.setRequiresExpression();
    this.insert(patcher.outerStart, 'return ');
  }

  /**
   * Return null to indicate that no empty case code should be generated.
   */
  getEmptyImplicitReturnCode(): string | null {
    return null;
  }

  /**
   * Patch the end of an implicitly-returned descendant.
   */
  patchImplicitReturnEnd(_patcher: NodePatcher): void { // eslint-disable-line no-unused-vars
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
  setExplicitlyReturns(): void {
    this._returns = true;
    if (this.parent) {
      this.parent.setExplicitlyReturns();
    }
  }

  /**
   * Mark that this node should have the given suffix appended at the end of
   * patching. For example, this allows a child node to indicate that this node
   * should end with a close-paren, and to do so in a way that respects patching
   * order (doesn't add the close-paren too early).
   */
  appendDeferredSuffix(suffix: string): void {
    this._deferredSuffix += suffix;
  }

  /**
   * Internal method that should be called at the end of patching to actually
   * place the deferred suffix in the right place.
   *
   * @protected
   */
  commitDeferredSuffix(): void {
    if (this._deferredSuffix) {
      this.insert(this.innerEnd, this._deferredSuffix);
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
   * Determines whether, when appearing as a statement, this patcher's node
   * needs to be surrounded by parentheses.
   *
   * Subclasses should override this and, typically, delegate to their leftmost
   * child patcher. Subclasses may return `false` when they will insert text at
   * the start of the node.
   */
  statementNeedsParens(): boolean {
    return false;
  }

  /**
   * Determines whether this patcher's node should add parentheses when used in
   * a statement context.
   */
  statementShouldAddParens(): boolean {
    return this.statementNeedsParens() && !this.isSurroundedByParentheses();
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
  indexOfSourceTokenStartingAtSourceIndex(index: number): SourceTokenListIndex | null {
    return this.getProgramSourceTokens().indexOfTokenStartingAtSourceIndex(index);
  }

  /**
   * Gets the index of the token between left and right patchers that matches
   * a predicate function.
   */
  indexOfSourceTokenBetweenPatchersMatching(left: NodePatcher, right: NodePatcher, predicate: (token: SourceToken) => boolean): SourceTokenListIndex | null {
    return this.indexOfSourceTokenBetweenSourceIndicesMatching(left.outerEnd, right.outerStart, predicate);
  }

  /**
   * Gets the index of the token between source locations that matches a
   * predicate function.
   */
  indexOfSourceTokenBetweenSourceIndicesMatching(left: number, right: number, predicate: (token: SourceToken) => boolean): SourceTokenListIndex | null {
    let tokenList = this.getProgramSourceTokens();
    return tokenList.indexOfTokenMatchingPredicate(
      token => {
        return (
          token.start >= left &&
          token.start <= right &&
          predicate(token)
        );
      },
      tokenList.indexOfTokenNearSourceIndex(left),
      tokenList.indexOfTokenNearSourceIndex(right).next()
    );
  }


  /**
   * Gets the token at a particular index.
   */
  sourceTokenAtIndex(index: SourceTokenListIndex): SourceToken | null {
    return this.getProgramSourceTokens().tokenAtIndex(index);
  }

  /**
   * Gets the source encompassed by the given token.
   */
  sourceOfToken(token: SourceToken): string {
    return this.context.source.slice(token.start, token.end);
  }

  /**
   * Gets the first token in the content of this node.
   */
  firstToken(): SourceToken | null {
    return this.sourceTokenAtIndex(this.contentStartTokenIndex);
  }

  /**
   * Gets the last token in the content of this node.
   */
  lastToken(): SourceToken | null {
    return this.sourceTokenAtIndex(this.contentEndTokenIndex);
  }

  /**
   * Gets the token after the end of this node, or null if there is none.
   */
  nextSemanticToken(): SourceToken | null {
    return this.getFirstSemanticToken(this.contentEnd, this.context.source.length);
  }

  /**
   * Gets the original source of this patcher's node.
   */
  getOriginalSource(): string {
    return this.context.source.slice(this.contentStart, this.contentEnd);
  }

  /**
   * Determines whether this patcher's node spanned multiple lines.
   */
  isMultiline(): boolean {
    return /\n/.test(this.getOriginalSource());
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
  indexOfSourceTokenAfterSourceTokenIndex(start: SourceTokenListIndex, type: SourceType, predicate: (token: SourceToken) => boolean=isSemanticToken): SourceTokenListIndex | null {
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
   * Also check if these parents are matching, to avoid false positives on things like `(a) && (b)`
   */
  isSurroundedByParentheses(): boolean {
    let beforeToken = this.sourceTokenAtIndex(this.outerStartTokenIndex);
    let afterToken = this.sourceTokenAtIndex(this.outerEndTokenIndex);

    if (!beforeToken || !afterToken) {
      return false;
    }

    let leftTokenType = SourceType.LPAREN;
    let rightTokenType = SourceType.RPAREN;

    if (beforeToken.type === SourceType.LPAREN && afterToken.type === SourceType.RPAREN) {
      // nothing
    } else if (beforeToken.type === SourceType.CALL_START && afterToken.type === SourceType.CALL_END) {
      leftTokenType = SourceType.CALL_START;
      rightTokenType = SourceType.CALL_END;
    } else {
      return false;
    }

    let parenRange = this.getProgramSourceTokens()
      .rangeOfMatchingTokensContainingTokenIndex(
        leftTokenType,
        rightTokenType,
        this.outerStartTokenIndex
      );
    if (!parenRange) {
      return false;
    }
    let rparenIndex = parenRange[1].previous();
    let rparen = this.sourceTokenAtIndex(notNull(rparenIndex));
    return rparen === afterToken;
  }

  surroundInParens(): void {
    if (!this.isSurroundedByParentheses()) {
      this.insert(this.outerStart, '(');
      this.insert(this.outerEnd, ')');
    }
  }

  getBoundingPatcher(): NodePatcher {
    if (this.isSurroundedByParentheses()) {
      return this;
    } else if (this.parent) {
      if (this.isNodeFunctionApplication(this.parent.node) &&
          this.parent.node.arguments.some(arg => arg === this.node)) {
        return this;
      } else if (this.parent.node.type === 'ArrayInitialiser') {
        return this;
      } else if (this.parent.node.type === 'ObjectInitialiser') {
        return this;
      }
      return this.parent.getBoundingPatcher();
    } else {
      return this;
    }
  }

  isNodeFunctionApplication(node: Node): node is FunctionApplication | SoakedFunctionApplication | NewOp {
    return node instanceof FunctionApplication ||
      node instanceof SoakedFunctionApplication ||
      node instanceof NewOp;
  }

  /**
   * Determines whether this patcher's node can be negated without prepending
   * a `!`, which turns it into a unary operator node.
   */
  canHandleNegationInternally(): boolean {
    return false;
  }

  /**
   * Negates this patcher's node when patching. Note that we add the `!` inside
   * any parens, since it's generally unsafe to insert code outside our
   * enclosing parens, and we need to handle the non-parenthesized case anyway.
   * Subclasses that need to worry about precedence (e.g. binary operators)
   * should override this method and do something more appropriate.
   */
  negate(): void {
    this.insert(this.contentStart, '!');
    this._hadUnparenthesizedNegation = true;
  }

  /**
   * Check if this node has been negated by simply adding a `!` to the front.
   * In some cases, this node may be later changed into an expression that would
   * require additional parens, e.g. a soak container being transformed into a
   * ternary expression, so track the negation so we know to add parens if
   * necessary.
   *
   * Note that most custom negate() implementations already add parens, so they
   * don't need to return true here.
   */
  hadUnparenthesizedNegation(): boolean {
    return this._hadUnparenthesizedNegation;
  }

  getScope(): Scope {
    return this.context.getScope(this.node);
  }

  /**
   * Gets the indent string for the line that starts this patcher's node.
   */
  getIndent(offset: number=0): string {
    return adjustIndent(
      this.context.source,
      this.contentStart,
      this.getAdjustedIndentLevel() + offset
    );
  }

  /**
   * Force the indentation level of this node, adjusting it forward or backward
   * if necessary. This also sets the "adjusted indent" level, so that later
   * calls to getIndent will return this value.
   */
  setIndent(indentStr: string): void {
    let currentIndent = this.getIndent();
    let indentLength = this.getProgramIndentString().length;
    let currentIndentLevel = currentIndent.length / indentLength;
    let desiredIndentLevel = indentStr.length / indentLength;
    this.indent(desiredIndentLevel - currentIndentLevel);
  }

  /**
   * Get the amount the adjusted indent level differs from the original level.
   */
  getAdjustedIndentLevel(): number {
    return (
      this.adjustedIndentLevel +
      (this.parent ? this.parent.getAdjustedIndentLevel() : 0)
    );
  }

  /**
   * Gets the indent string used for each indent in this program.
   */
  getProgramIndentString(): string {
    return notNull(this.parent).getProgramIndentString();
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
  indent(offset: number=1, {skipFirstLine=false}: {skipFirstLine?: boolean}={}): void {
    if (offset === 0) {
      return;
    }

    this.adjustedIndentLevel += offset;
    let indentString = this.getProgramIndentString();
    let indentToChange = indentString.repeat(Math.abs(offset));
    let start = this.outerStart;
    let end = this.outerEnd;
    let { source } = this.context;

    // See if there are already non-whitespace characters before the start. If
    // so, skip the start to the next line, since we don't want to put
    // indentation in the middle of a line.
    if (skipFirstLine || !this.isFirstNodeInLine()) {
      while (start < end && source[start] !== '\n') {
        start++;
      }
    }

    let hasIndentedThisLine = false;
    for (let i = start; i < end; i++) {
      switch (source[i]) {
        case '\n':
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
              // Ignore this case: we're trying to unindent a line that doesn't
              // start with enough indentation, or doesn't start with the right
              // type of indentation, e.g. it starts with spaces when the
              // program indent string is a tab. This can happen when a file
              // uses inconsistent indentation in different parts. We only
              // expect this to come up in the main stage, so getting
              // indentation wrong means ugly JS code that's still correct.
              this.log(
                'Warning: Ignoring an unindent operation because the line ' +
                'did not start with the proper indentation.');
            }
            hasIndentedThisLine = true;
          }
          break;
      }
    }
  }

  isFirstNodeInLine(startingPoint: number = this.outerStart): boolean {
    let { source } = this.context;
    for (let i = startingPoint - 1; i >= 0 && source[i] !== '\n'; i--) {
      if (source[i] !== '\t' && source[i] !== ' ') {
        return false;
      }
    }
    return true;
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
  appendLineAfter(content: string, indentOffset: number=0): void {
    let boundingPatcher = this.getBoundingPatcher();
    let endOfLine = this.getEndOfLine();
    this.insert(
      Math.min(endOfLine, boundingPatcher.innerEnd),
      `\n${this.getIndent(indentOffset)}${content}`
    );
  }

  /**
   * Generate an error referring to a particular section of the source.
   */
  error(message: string, start: number = this.contentStart, end: number = this.contentEnd, error: Error | null = null): PatcherError {
    let patcherError = new PatcherError(message, this.context.source, start, end);
    if (error) { patcherError.stack = error.stack; }
    return patcherError;
  }

  /**
   * Register a helper to be reused in several places.
   */
  registerHelper(name: string, code: string): string {
    return notNull(this.parent).registerHelper(name, code);
  }

  /**
   * Determines whether this code might have side-effects when run. Most of the
   * time this is the same as isRepeatable, but sometimes the node is
   * long/complicated enough that it's better to extract it as a variable rather
   * than repeat the expression. In that case, a node may declare itself as pure
   * but not repeatable.
   */
  isPure(): boolean {
    return this.isRepeatable();
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
   * Indicate to this patcher that patching should be done in a way that makes
   * it possible to reference the value afterward with no additional
   * side-effects.
   */
  setRequiresRepeatableExpression(repeatableOptions: RepeatableOptions = {}): void {
    this._repeatableOptions = repeatableOptions;
  }

  /**
   * Check if this expression has been marked as repeatable, and if so, the
   * repeat options used. Generally this should only be used for advanced cases,
   * like transferring the repeat code result from one patcher to another.
   */
  getRepeatableOptions(): RepeatableOptions | null {
    return this._repeatableOptions;
  }

  /**
   * Get the code snippet computed from patchAsRepeatableExpression that can be
   * used to refer to the result of this expression without further
   * side-effects.
   */
  getRepeatCode(): string {
    if (this._repeatCode === null) {
      throw new Error('Must patch as a repeatable expression to access repeat code.');
    }
    return this._repeatCode;
  }

  /**
   * Explicitly set the repeatable result. Generally this should only be used
   * for advanced cases, like transferring the repeat code result from one
   * patcher to another.
   */
  overrideRepeatCode(repeatCode: string): void {
    this._repeatCode = repeatCode;
  }

  /**
   * Claim a binding that is unique in the current scope.
   */
  claimFreeBinding(ref: string | Array<string> | null = null): string {
    return this.getScope().claimFreeBinding(this.node, ref);
  }

  /**
   * Determines whether all the possible code paths in this node are present.
   */
  allCodePathsPresent(): boolean {
    return true;
  }

  /**
   * Gets the first "interesting token" in the indexed range (default range is `this` + parent)
   */
  getFirstSemanticToken(from: number=this.contentStart, to: number = notNull(this.parent).contentEnd): SourceToken | null {
    let nextSemanticIdx = this.indexOfSourceTokenBetweenSourceIndicesMatching(from, to, isSemanticToken);
    return nextSemanticIdx && this.sourceTokenAtIndex(nextSemanticIdx);
  }

  /**
   * Determine if we need to do a `typeof` check in a conditional for this
   * value, to guard against the case where this node is a variable that doesn't
   * exist. IdentifierPatcher overrides this to check the current scope.
   */
  mayBeUnboundReference(): boolean {
    return false;
  }

  patchInIIFE(innerPatchFn: () => void): void {
    this.addSuggestion(AVOID_IIFES);
    if (this.containsYield()) {
      this.insert(this.innerStart, 'yield* (function*() {');
    } else {
      this.insert(this.innerStart, '(() => {');
    }
    innerPatchFn();
    if (this.containsYield()) {
      if (this.referencesArguments()) {
        this.insert(this.innerEnd, '}).apply(this, arguments)');
      } else {
        this.insert(this.innerEnd, '}).call(this)');
      }
    } else {
      this.insert(this.innerEnd, '})()');
    }
  }

  /**
   * Call to indicate that this node yields.
   */
  yields(): void {
    this._containsYield = true;
    if (this.parent && !isFunction(this.parent.node)) {
      this.parent.yields();
    }
  }

  /**
   * Determine if this node or one of its children within the function is a
   * yield statement.
   */
  containsYield(): boolean {
    return this._containsYield;
  }

  /**
   * @private
   */
  referencesArguments(): boolean {
    let result = false;

    traverse(this.node, node => {
      if (result || isFunction(node)) {
        return false;
      }

      if (node instanceof Identifier && node.data === 'arguments') {
        result = true;
      }
      return true;
    });

    return result;
  }
}
