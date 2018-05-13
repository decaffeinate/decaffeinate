import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import getEnclosingScopeBlock from '../../../utils/getEnclosingScopeBlock';
import notNull from '../../../utils/notNull';
import BlockPatcher from './BlockPatcher';

/**
 * Handles `try` statements, e.g. `try a catch e then console.log(e)`.
 */
export default class TryPatcher extends NodePatcher {
  body: BlockPatcher | null;
  catchAssignee: NodePatcher | null;
  catchBody: BlockPatcher | null;
  finallyBody: BlockPatcher | null;

  _errorBinding: string | null = null;

  constructor(
    patcherContext: PatcherContext,
    body: BlockPatcher | null,
    catchAssignee: NodePatcher | null,
    catchBody: BlockPatcher | null,
    finallyBody: BlockPatcher | null
  ) {
    super(patcherContext);
    this.body = body;
    this.catchAssignee = catchAssignee;
    this.catchBody = catchBody;
    this.finallyBody = finallyBody;
  }

  initialize(): void {
    if (this.catchAssignee) {
      this.catchAssignee.setAssignee();
      this.catchAssignee.setRequiresExpression();
    }
    getEnclosingScopeBlock(this).markIIFEPatcherDescendant(this);
  }

  canPatchAsExpression(): boolean {
    if (this.body && !this.body.canPatchAsExpression()) {
      return false;
    }
    if (this.catchBody && !this.catchBody.canPatchAsExpression()) {
      return false;
    }
    if (this.finallyBody && !this.finallyBody.canPatchAsExpression()) {
      return false;
    }
    return true;
  }

  /**
   * 'try' BODY ( 'catch' ASSIGNEE? CATCH-BODY? )? ( 'finally' FINALLY-BODY )?
   */
  patchAsStatement(): void {
    let tryToken = this.getTryToken();
    let catchToken = this.getCatchToken();
    let thenTokenIndex = this.getThenTokenIndex();
    let finallyToken = this.getFinallyToken();

    // `try a` → `try { a`
    //               ^^
    this.insert(tryToken.end, ` {`);
    if (this.body) {
      if (this.body.inline()) {
        this.body.patch({ leftBrace: false });
      } else {
        if (catchToken || finallyToken) {
          this.body.patch({ leftBrace: false, rightBrace: false });
          // `try { a; catch err` → `try { a; } catch err`
          //                                  ^^
          this.insert(notNull(catchToken || finallyToken).start, '} ');
        } else {
          this.body.patch({ leftBrace: false });
        }
      }
    } else {
      this.insert(tryToken.end, '}');
    }

    if (thenTokenIndex) {
      let thenToken = notNull(this.sourceTokenAtIndex(thenTokenIndex));
      let nextToken = this.sourceTokenAtIndex(notNull(thenTokenIndex.next()));
      // `try { a; } catch err then b` → `try { a; } catch err b`
      //                       ^^^^^
      if (nextToken) {
        this.remove(thenToken.start, nextToken.start);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }

    if (catchToken) {
      let afterCatchHeader = this.catchAssignee ? this.catchAssignee.outerEnd : catchToken.end;

      if (this.catchAssignee) {
        let addErrorParens = !this.catchAssignee.isSurroundedByParentheses();
        if (addErrorParens) {
          // `try { a; } catch err` → `try { a; } catch (err`
          //                                            ^
          this.insert(this.catchAssignee.outerStart, '(');
        }
        this.catchAssignee.patch();
        if (addErrorParens) {
          // `try { a; } catch (err` → `try { a; } catch (err)`
          //                                                 ^
          this.insert(this.catchAssignee.outerEnd, ')');
        }
      } else {
        // `try { a; } catch` → `try { a; } catch (error)`
        //                                       ^^^^^^^^
        this.insert(afterCatchHeader, ` (${this.getErrorBinding()})`);
      }

      if (this.catchBody) {
        // `try { a; } catch (error)` → `try { a; } catch (error) {`
        //                                                       ^^
        this.insert(afterCatchHeader, ' {');
        this.catchBody.patch({ leftBrace: false });
      } else {
        this.insert(afterCatchHeader, ' {}');
      }
    } else if (!finallyToken) {
      // `try { a; }` → `try { a; } catch (error) {}`
      //                           ^^^^^^^^^^^^^^^^^
      let insertPos = this.body ? this.body.innerEnd : tryToken.end;
      this.insert(insertPos, ` catch (${this.getErrorBinding()}) {}`);
    }

    if (finallyToken) {
      if (!this.finallyBody) {
        this.insert(finallyToken.end, ' {}');
      } else if (this.finallyBody.inline()) {
        this.finallyBody.patch();
      } else {
        // `try { a; } finally b` → `try { a; } finally { b`
        //                                             ^^
        this.insert(finallyToken.end, ' {');
        this.finallyBody.patch({ leftBrace: false });
      }
    }
  }

  patchAsExpression(): void {
    // Make our children return since we're wrapping in a function.
    this.setImplicitlyReturns();

    this.patchInIIFE(() => {
      this.insert(this.innerStart, ' ');
      this.patchAsStatement();
      this.insert(this.innerEnd, ' ');
    });
  }

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression();
  }

  canHandleImplicitReturn(): boolean {
    return this.willPatchAsExpression();
  }

  /**
   * If we're a statement, our children can handle implicit return, so no need
   * to convert to an expression.
   */
  implicitlyReturns(): boolean {
    return super.implicitlyReturns() && this.willPatchAsExpression();
  }

  setImplicitlyReturns(): void {
    super.setImplicitlyReturns();
    if (this.body) {
      this.body.setImplicitlyReturns();
    }
    if (this.catchBody) {
      this.catchBody.setImplicitlyReturns();
    }
  }

  statementNeedsSemicolon(): boolean {
    return false;
  }

  /**
   * @private
   */
  getTryToken(): SourceToken {
    let tryTokenIndex = this.contentStartTokenIndex;
    let tryToken = this.sourceTokenAtIndex(tryTokenIndex);
    if (!tryToken || tryToken.type !== SourceType.TRY) {
      throw this.error(`expected 'try' keyword at start of 'try' statement`);
    }
    return tryToken;
  }

  /**
   * @private
   */
  getCatchToken(): SourceToken | null {
    let searchStart;
    if (this.body) {
      searchStart = this.body.outerEnd;
    } else {
      searchStart = this.getTryToken().end;
    }

    let searchEnd;
    if (this.catchAssignee) {
      searchEnd = this.catchAssignee.outerStart;
    } else if (this.catchBody) {
      searchEnd = this.catchBody.outerStart;
    } else if (this.finallyBody) {
      searchEnd = this.finallyBody.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }

    let catchTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart,
      searchEnd,
      token => token.type === SourceType.CATCH
    );
    if (!catchTokenIndex) {
      return null;
    }
    return this.sourceTokenAtIndex(catchTokenIndex);
  }

  /**
   * @private
   */
  getThenTokenIndex(): SourceTokenListIndex | null {
    let searchStart;
    if (this.catchAssignee) {
      searchStart = this.catchAssignee.outerEnd;
    } else if (this.body) {
      searchStart = this.body.outerEnd;
    } else {
      searchStart = this.getTryToken().end;
    }

    let searchEnd;
    if (this.catchBody) {
      searchEnd = this.catchBody.outerStart;
    } else if (this.finallyBody) {
      searchEnd = this.finallyBody.outerStart;
    } else {
      // The CoffeeScript AST doesn't always include a "then" in the node range,
      // so look one more token past the end.
      let nextToken = this.nextSemanticToken();
      if (nextToken) {
        searchEnd = nextToken.end;
      } else {
        searchEnd = this.contentEnd;
      }
    }

    return this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart,
      searchEnd,
      token => token.type === SourceType.THEN
    );
  }

  /**
   * @private
   */
  getFinallyToken(): SourceToken | null {
    let searchStart;
    if (this.catchBody) {
      searchStart = this.catchBody.outerEnd;
    } else if (this.catchAssignee) {
      searchStart = this.catchAssignee.outerEnd;
    } else if (this.body) {
      searchStart = this.body.outerEnd;
    } else {
      searchStart = this.getTryToken().end;
    }

    let searchEnd;
    if (this.finallyBody) {
      searchEnd = this.finallyBody.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }

    let finallyTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart,
      searchEnd,
      token => token.type === SourceType.FINALLY
    );
    if (!finallyTokenIndex) {
      return null;
    }
    return this.sourceTokenAtIndex(finallyTokenIndex);
  }

  /**
   * @private
   */
  getErrorBinding(): string {
    if (!this._errorBinding) {
      this._errorBinding = this.claimFreeBinding('error');
    }
    return this._errorBinding;
  }
}
