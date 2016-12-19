import NodePatcher from '../../../patchers/NodePatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { PatcherContext, SourceToken, SourceTokenListIndex } from '../../../patchers/types.js';
import { SourceType } from 'coffee-lex';

/**
 * Handles `try` statements, e.g. `try a catch e then console.log(e)`.
 */
export default class TryPatcher extends NodePatcher {
  body: BlockPatcher;
  catchAssignee: ?NodePatcher;
  catchBody: ?BlockPatcher;
  finallyBody: ?BlockPatcher;

  constructor(patcherContext: PatcherContext, body: BlockPatcher, catchAssignee: ?NodePatcher, catchBody: ?BlockPatcher, finallyBody: ?BlockPatcher) {
    super(patcherContext);
    this.body = body;
    this.catchAssignee = catchAssignee;
    this.catchBody = catchBody;
    this.finallyBody = finallyBody;
  }

  initialize() {
    if (this.catchAssignee) {
      this.catchAssignee.setRequiresExpression();
    }
  }

  /**
   * 'try' BODY ( 'catch' ASSIGNEE? CATCH-BODY? )? ( 'finally' FINALLY-BODY )?
   */
  patchAsStatement() {
    let tryToken = this.getTryToken();
    let catchToken = this.getCatchToken();
    let thenTokenIndex = this.getThenTokenIndex();
    let finallyToken = this.getFinallyToken();

    // `try a` → `try { a`
    //               ^^
    this.insert(tryToken.end, ` {`);
    if (this.body.inline()) {
      this.body.patch({ leftBrace: false });
    } else {
      if (catchToken || finallyToken) {
        this.body.patch({ leftBrace: false, rightBrace: false });
        // `try { a; catch err` → `try { a; } catch err`
        //                                  ^^
        this.insert((catchToken || finallyToken).start, '} ');
      } else {
        this.body.patch({ leftBrace: false });
      }
    }

    if (thenTokenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenTokenIndex);
      let nextToken = this.sourceTokenAtIndex(thenTokenIndex.next());
      // `try { a; } catch err then b` → `try { a; } catch err b`
      //                       ^^^^^
      this.remove(thenToken.start, nextToken.start);
    }

    if (catchToken) {
      let afterCatchHeader =
        this.catchAssignee ?
          this.catchAssignee.outerEnd :
          catchToken.end;

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
      this.insert(this.body.innerEnd, ` catch (${this.getErrorBinding()}) {}`);
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

  patchAsExpression() {
    // Make our children return since we're wrapping in a function.
    this.setImplicitlyReturns();

    let needsParens = !this.isSurroundedByParentheses();
    if (needsParens) {
      // `a = try b()` → `a = (try b()`
      //                      ^
      this.insert(this.outerStart, '(');
    }
    // `a = (try b()` → `a = (() => { try b()`
    //                        ^^^^^^^^
    this.insert(this.outerStart, '() => { ');
    this.patchAsStatement();
    // `a = (() => { try { b(); } catch (error) {}` → `a = (() => { try { b(); } catch (error) {} }`
    //                                                                                           ^^
    this.insert(this.outerEnd, ' }');
    if (needsParens) {
      // `a = (() => { try { b(); } catch (error) {} }` → `a = (() => { try { b(); } catch (error) {} })`
      //                                                                                               ^
      this.insert(this.outerEnd, ')');
    }
    // `a = (() => { try { b(); } catch (error) {} })` → `a = (() => { try { b(); } catch (error) {} })()`
    //                                                                                                 ^^
    this.insert(this.outerEnd, '()');
  }

  setImplicitlyReturns() {
    this.body.setImplicitlyReturns();
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
  getCatchToken(): ?SourceToken {
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
      this.body.outerEnd, searchEnd, token => token.type === SourceType.CATCH
    );
    if (!catchTokenIndex) {
      return null;
    }
    return this.sourceTokenAtIndex(catchTokenIndex);
  }

  /**
   * @private
   */
  getThenTokenIndex(): ?SourceTokenListIndex {
    if (!this.catchBody) {
      return null;
    }
    return this.indexOfSourceTokenBetweenPatchersMatching(
      this.catchAssignee || this.body, this.catchBody,
      token => token.type === SourceType.THEN
    );
  }

  /**
   * @private
   */
  getFinallyToken(): ?SourceToken {
    let searchStart;
    if (this.catchBody) {
      searchStart = this.catchBody.outerEnd;
    } else if (this.catchAssignee) {
      searchStart = this.catchAssignee.outerEnd;
    } else {
      searchStart = this.body.outerEnd;
    }

    let searchEnd;
    if (this.finallyBody) {
      searchEnd = this.finallyBody.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }

    let finallyTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart, searchEnd, token => token.type === SourceType.FINALLY
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
