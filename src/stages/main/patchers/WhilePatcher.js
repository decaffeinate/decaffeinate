import NodePatcher from './../../../patchers/NodePatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Editor, Node, ParseContext, SourceTokenListIndex } from './../../../patchers/types.js';
import { LOOP, THEN, WHILE } from 'coffee-lex';

/**
 * Handles `while` loops, e.g.
 *
 *   while a
 *     b
 */
export default class WhilePatcher extends NodePatcher {
  condition: NodePatcher;
  guard: ?NodePatcher;
  body: BlockPatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, condition: NodePatcher, guard: ?NodePatcher, body: BlockPatcher) {
    super(node, context, editor);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
  }

  /**
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? 'then' BODY
   * ( 'while' | 'until' ) CONDITION ('when' GUARD)? NEWLINE INDENT BODY
   * 'loop' 'then' BODY
   * 'loop' NEWLINE INDENT BODY
   */
  patchAsStatement() {
    // `until a` → `while a`
    //  ^^^^^       ^^^^^
    let whileToken = this.sourceTokenAtIndex(this.getWhileTokenIndex());
    let isLoop = whileToken.type === LOOP;

    if (isLoop) {
      this.overwrite(whileToken.start, whileToken.end, 'while (true) {');
    } else {
      this.overwrite(whileToken.start, whileToken.end, 'while');

      let conditionNeedsParens = !this.condition.isSurroundedByParentheses();
      if (conditionNeedsParens) {
        // `while a` → `while (a`
        //                    ^
        this.insert(this.condition.outerStart, '(');
      }

      if (this.node.isUntil) {
        this.condition.negate();
      }
      this.condition.patch();

      if (this.guard) {
        let guardNeedsParens = !this.guard.isSurroundedByParentheses();
        if (this.body.inline()) {
          // `while (a when b` → `while (a) { if (b`
          //          ^^^^^^              ^^^^^^^^
          this.overwrite(
            this.condition.outerEnd,
            this.guard.outerStart,
            `${conditionNeedsParens ? ')' : ''} { if ${guardNeedsParens ? '(' : ''}`
          );
        } else {
          let bodyIndent = this.body.getIndent();
          // `while (a when b` → `while (a) {\n  if (b`
          //          ^^^^^^              ^^^^^^^^^^^
          this.overwrite(
            this.condition.outerEnd,
            this.guard.outerStart,
            `${conditionNeedsParens ? ')' : ''} {\n${bodyIndent}if ${guardNeedsParens ? '(' : ''}`
          );

        }
        this.guard.patch();

        // `while (a) {\n  if (b` → `while (a) {\n  if (b) {`
        //                                               ^^^
        this.insert(this.guard.outerEnd, `${guardNeedsParens ? ')' : ''} {`);
        if (!this.body.inline()) {
          this.body.indent();
        }
      } else {
        // `while (a` → `while (a) {`
        //                       ^^^
        this.insert(this.condition.outerEnd, `${conditionNeedsParens ? ')' : ''} {`);
      }
    }

    let thenIndex = this.getThenTokenIndex();
    if (thenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenIndex);
      let nextToken = this.sourceTokenAtIndex(thenIndex.next());
      this.remove(thenToken.start, nextToken.start);
    }

    if (this.willPatchAsExpression() && !this.allBodyCodePathsPresent()) {
      let itemBinding = this.getResultArrayElementBinding();
      this.body.insertStatementsAtIndex([`var ${itemBinding}`], 0);
      this.body.patch({ leftBrace: false, rightBrace: false });
      this.body.insertStatementsAtIndex(
        [`${this.getResultArrayBinding()}.push(${itemBinding})`],
        this.body.statements.length
      );
    } else {
      this.body.patch({ leftBrace: false, rightBrace: false });
    }

    if (this.guard) {
      // Close the guard's `if` consequent block.
      if (this.body.inline()) {
        this.insert(this.body.innerEnd, ' }');
      } else {
        this.body.appendLineAfter('}', -1);
      }
    }

    // Close the `while` body block.
    if (this.body.inline()) {
      this.insert(this.body.innerEnd, ' }');
    } else {
      this.appendLineAfter('}');
    }
  }

  patchAsExpression() {
    this.body.setImplicitlyReturns();
    let resultBinding = this.getResultArrayBinding();
    this._yielding = null;
    this.patchAsStatement();
    let isYielding = !!this._yielding;
    this._yielding = null;
    let prefix = isYielding ? 'yield* (function*()' : '(() =>';
    this.insert(this.contentStart, `${prefix} { ${resultBinding} = []; `);
    let postfix = isYielding ? '.call(this)' : '()';
    this.insert(this.contentEnd, ` return ${resultBinding}; })${postfix}`);
    if (isYielding) {
      this.yields();
    }
  }

  yieldController(node) {
    this._yielding = node;
  }

  /**
   * Most implicit returns cause program flow to break by using a `return`
   * statement, but we don't do that since we're just collecting values in
   * an array. This allows descendants who care about this to adjust their
   * behavior accordingly.
   */
  implicitReturnWillBreak(): boolean {
    if (this.willPatchAsExpression()) {
      return false;
    } else {
      return super.implicitReturnWillBreak();
    }
  }

  /**
   * We decide how statements in implicit return positions are patched, if
   * we're being used as an expression. This is because we don't want to return
   * them, but add them to an array.
   */
  implicitReturnPatcher(): NodePatcher {
    if (this.willPatchAsExpression()) {
      return this;
    } else {
      return super.implicitReturnPatcher();
    }
  }

  /**
   * If this `while` is used as an expression, then we need to collect all the
   * values of the statements in implicit-return position. If all the code paths
   * in our body are present, we can just add `result.push(…)` to all
   * implicit-return position statements. If not, we want those code paths to
   * result in adding `undefined` to the resulting array. The way we do that is
   * by creating an `item` local variable that we set in each code path, and
   * when the code exits through a missing code path (i.e. `if false then b`)
   * then `item` will naturally have the value `undefined` which we then push
   * at the end of the `while` body.
   */
  patchImplicitReturnStart(patcher: NodePatcher) {
    patcher.setRequiresExpression();
    if (this.allBodyCodePathsPresent()) {
      // `a + b` → `result.push(a + b`
      //            ^^^^^^^^^^^^
      this.insert(patcher.outerStart, `${this.getResultArrayBinding()}.push(`);
    } else {
      // `a + b` → `item = a + b`
      //            ^^^^^^^
      this.insert(patcher.outerStart, `${this.getResultArrayElementBinding()} = `);
    }
  }

  /**
   * @see patchImplicitReturnStart
   */
  patchImplicitReturnEnd(patcher: NodePatcher) {
    if (this.allBodyCodePathsPresent()) {
      this.insert(patcher.outerEnd, `)`);
    }
  }

  /**
   * @private
   */
  allBodyCodePathsPresent(): boolean {
    if (this._allBodyCodePathsPresent === undefined) {
      this._allBodyCodePathsPresent = this.body.allCodePathsPresent();
    }
    return this._allBodyCodePathsPresent;
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

  statementNeedsSemicolon() {
    return false;
  }

  /**
   * @private
   */
  getWhileTokenIndex(): SourceTokenListIndex {
    let whileTokenIndex = this.contentStartTokenIndex;
    let whileToken = this.sourceTokenAtIndex(whileTokenIndex);
    if (!whileToken) {
      throw this.error(`could not get first token of 'while' loop`);
    }
    switch (whileToken.type) {
      case LOOP:
      case WHILE:
        return whileTokenIndex;

      default:
        throw this.error(
          `expected 'while' token to be type WHILE or LOOP, got ${whileToken.type.name}`
        );
    }
  }

  /**
   * @private
   */
  getThenTokenIndex(): ?SourceTokenListIndex {
    let whileTokenIndex = this.getWhileTokenIndex();
    if (!whileTokenIndex) {
      throw this.error(`could not get first token of 'while' loop`);
    }

    let whileToken = this.sourceTokenAtIndex(whileTokenIndex);
    if (whileToken.type === LOOP) {
      // `loop then …`
      let nextTokenIndex = whileTokenIndex.next();
      let nextToken = this.sourceTokenAtIndex(nextTokenIndex);
      if (!nextToken) {
        throw this.error(`expected another token after 'loop' but none was found`);
      }
      return nextToken.type === THEN ? nextTokenIndex : null;
    } else {
      // `while a then …`
      return this.indexOfSourceTokenBetweenPatchersMatching(
        this.guard || this.condition,
        this.body,
        token => token.type === THEN
      );
    }
  }
}
