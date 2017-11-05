import { PatcherContext } from '../../../patchers/types';
import getEnclosingScopeBlock from '../../../utils/getEnclosingScopeBlock';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';

export default class LoopPatcher extends NodePatcher {
  body: BlockPatcher | null;

  _resultArrayBinding: string | null = null;
  _resultArrayElementBinding: string | null = null;

  constructor(patcherContext: PatcherContext, body: BlockPatcher) {
    super(patcherContext);
    this.body = body;
  }

  initialize(): void {
    getEnclosingScopeBlock(this).markIIFEPatcherDescendant(this);
  }

  patchAsExpression(): void {
    // We're only patched as an expression due to a parent instructing us to,
    // and the indent level is more logically the indent level of our parent.
    let baseIndent = notNull(this.parent).getIndent(0);
    let iifeBodyIndent = this.getLoopIndent();
    if (this.body !== null) {
      this.body.setShouldPatchInline(false);
      this.body.setImplicitlyReturns();
      this.body.setIndent(this.getLoopBodyIndent());
    }
    let resultBinding = this.getResultArrayBinding();
    this.patchInIIFE(() => {
      this.insert(this.innerStart, `\n${iifeBodyIndent}${resultBinding} = [];\n${iifeBodyIndent}`);
      this.patchAsStatement();
      this.insert(this.innerEnd, `\n${iifeBodyIndent}return ${resultBinding};\n${baseIndent}`);
    });
  }

  /**
   * The first of three meaningful indentation levels for where we might want to
   * insert code.
   *
   * As an example, in this code:
   * a((() => {
   *   for (let i = 0; i < b.length; i++) {
   *     let val = b[i];
   *     if (val) {
   *       c;
   *     }
   *   )
   * })())
   *
   * - `getLoopIndent` returns the indentation of the `for`.
   * - `getOuterLoopBodyIndent` returns the indentation of the `if`.
   * - `getLoopBodyIndent` returns the indentation of `c`.
   *
   * However, these levels may change based on whether the loop has a condition,
   * and whether the loop is being formatted as an IIFE or as a regular loop
   * statement.
   *
   * We need to be especially careful about when to actually set the indentation
   * of existing code, since doing that too much can confuse magic-string. The
   * only code that actually is adjusted is the loop body (but only when it's
   * not an inline body), and this is done relatively early on in all cases.
   */
  getLoopIndent(): string {
    if (this.willPatchAsExpression()) {
      return notNull(this.parent).getIndent(1);
    } else {
      return this.getIndent();
    }
  }

  /**
   * @see getLoopIndent.
   */
  getOuterLoopBodyIndent(): string {
    return this.getLoopIndent() + this.getProgramIndentString();
  }

  /**
   * @see getLoopIndent.
   */
  getLoopBodyIndent(): string {
    throw this.error(`'getLoopBodyIndent' must be overridden in subclasses`);
  }

  /**
   * IIFE-style loop expressions should always be multi-line, even if the loop
   * body in CoffeeScript is inline. This means we need to use a different
   * patching strategy where we insert a newline in the proper place before
   * generating code around the body, then we need to directly create the
   * indentation just before patching the body.
   */
  patchPossibleNewlineAfterLoopHeader(loopHeaderEndIndex: number): void {
    if (this.body && this.shouldConvertInlineBodyToNonInline()) {
      this.overwrite(loopHeaderEndIndex, this.body.contentStart, `\n`);
    }
  }

  patchBody(): void {
    if (this.body) {
      if (this.shouldConvertInlineBodyToNonInline()) {
        this.body.insert(this.body.outerStart, this.getLoopBodyIndent());
      }
      this.body.patch({ leftBrace: false, rightBrace: false });
    }
  }

  shouldConvertInlineBodyToNonInline(): boolean {
    return this.willPatchAsExpression() && this.body !== null && this.body.node.inline;
  }

  canHandleImplicitReturn(): boolean {
    return this.willPatchAsIIFE();
  }

  willPatchAsIIFE(): boolean {
    throw this.error(`'willPatchAsIIFE' must be overridden in subclasses`);
  }

  /**
   * Most implicit returns cause program flow to break by using a `return`
   * statement, but we don't do that since we're just collecting values in
   * an array. This allows descendants who care about this to adjust their
   * behavior accordingly.
   */
  implicitReturnWillBreak(): boolean {
    return false;
  }

  /**
   * If this loop is used as an expression, then we need to collect all the
   * values of the statements in implicit-return position. If all the code paths
   * in our body are present, we can just add `result.push(…)` to all
   * implicit-return position statements. If not, we want those code paths to
   * result in adding `undefined` to the resulting array. The way we do that is
   * by creating an `item` local variable that we set in each code path, and
   * when the code exits through a missing code path (i.e. `if false then b`)
   * then `item` will naturally have the value `undefined` which we then push
   * at the end of the loop body.
   */
  patchImplicitReturnStart(patcher: NodePatcher): void {
    // Control flow statements like break and continue should be skipped.
    // Unlike some other control flow statements, CoffeeScript does not allow
    // them to be wrapped in parens, so we don't need to remove any parens here.
    if (!patcher.canPatchAsExpression()) {
      return;
    }
    patcher.setRequiresExpression();
    // `a + b` → `result.push(a + b`
    //            ^^^^^^^^^^^^
    this.insert(patcher.outerStart, `${this.getResultArrayBinding()}.push(`);
  }

  /**
   * @see patchImplicitReturnStart
   */
  patchImplicitReturnEnd(patcher: NodePatcher): void {
    if (!patcher.canPatchAsExpression()) {
      return;
    }
    this.insert(patcher.outerEnd, `)`);
  }

  getEmptyImplicitReturnCode(): string {
    return `${this.getResultArrayBinding()}.push(undefined)`;
  }

  /**
   * @private
   */
  getResultArrayBinding(): string {
    if (!this._resultArrayBinding) {
      this._resultArrayBinding = this.claimFreeBinding('result');
    }
    return this._resultArrayBinding;
  }

  /**
   * @private
   */
  getResultArrayElementBinding(): string {
    if (!this._resultArrayElementBinding) {
      this._resultArrayElementBinding = this.claimFreeBinding('item');
    }
    return this._resultArrayElementBinding;
  }

  statementNeedsSemicolon(): boolean {
    return false;
  }
}
