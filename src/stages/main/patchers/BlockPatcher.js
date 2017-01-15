import FunctionPatcher from './FunctionPatcher';
import NodePatcher from './../../../patchers/SharedBlockPatcher';
import SharedBlockPatcher from '../../../patchers/SharedBlockPatcher';
import ReturnPatcher from './ReturnPatcher';
import type { SourceToken } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class BlockPatcher extends SharedBlockPatcher {
  canPatchAsExpression(): boolean {
    return this.statements.every(
      statement => statement.prefersToPatchAsExpression()
    );
  }

  setExpression(force=false): boolean {
    let willPatchAsExpression = super.setExpression(force);
    if (willPatchAsExpression && this.prefersToPatchAsExpression()) {
      this.statements.forEach(statement => statement.setExpression());
    }
  }

  setImplicitlyReturns() {
    this.statements[this.statements.length - 1].setImplicitlyReturns();
  }

  /**
   * Force the patcher to treat the block as inline (semicolon-separated
   * statements) or not (newline-separated statements).
   */
  setShouldPatchInline(shouldPatchInline: boolean) {
    this.shouldPatchInline = shouldPatchInline;
  }

  patchAsStatement({ leftBrace=true, rightBrace=true }={}) {
    if (leftBrace) {
      this.insert(this.innerStart, '{');
    }

    this.statements.forEach(
      (statement, i, statements) => {
        if (i === statements.length - 1 && this.parent instanceof FunctionPatcher) {
          if (statement instanceof ReturnPatcher && !statement.expression) {
            let removeStart;
            if (statements.length > 1) {
              let startOfLineIndex = this.context.sourceTokens.lastIndexOfTokenMatchingPredicate(
                token => token.type === SourceType.NEWLINE || token.type === SourceType.SEMICOLON,
                statement.outerStartTokenIndex
              );
              removeStart = this.sourceTokenAtIndex(startOfLineIndex).start;
            } else {
              removeStart = statement.outerStart;
            }
            this.remove(
              removeStart,
              statement.outerEnd
            );
            return;
          }
        }
        if (statement.isSurroundedByParentheses()) {
          statement.setRequiresExpression();
        }
        let hasImplicitReturn = (
          statement.implicitlyReturns() &&
          !statement.explicitlyReturns()
        );
        let implicitReturnPatcher = hasImplicitReturn ?
          this.implicitReturnPatcher() : null;
        if (implicitReturnPatcher) {
          implicitReturnPatcher.patchImplicitReturnStart(statement);
        }
        statement.patch();
        if (implicitReturnPatcher) {
          implicitReturnPatcher.patchImplicitReturnEnd(statement);
        }
        if (statement.statementNeedsSemicolon()) {
          this.insert(statement.outerEnd, ';');
        }
      }
    );

    if (rightBrace) {
      if (this.inline()) {
        this.insert(this.innerEnd, ' }');
      } else {
        this.appendLineAfter('}', -1);
      }
    }
  }

  patchAsExpression({
    leftBrace=this.statements.length > 1,
    rightBrace=this.statements.length > 1
    }={}) {
    if (leftBrace) {
      this.insert(this.innerStart, '(');
    }
    this.statements.forEach(
      (statement, i, statements) => {
        statement.patch();
        if (i !== statements.length - 1) {
          let semicolonTokenIndex = this.getSemicolonSourceTokenBetween(
            statement,
            statements[i + 1]
          );
          if (semicolonTokenIndex) {
            let semicolonToken = this.sourceTokenAtIndex(semicolonTokenIndex);
            this.overwrite(semicolonToken.start, semicolonToken.end, ',');
          } else {
            this.insert(statement.outerEnd, ',');
          }
        }
      }
    );
    if (rightBrace) {
      this.insert(this.innerEnd, ')');
    }
  }

  /**
   * @private
   */
  getSemicolonSourceTokenBetween(left: NodePatcher, right: NodePatcher): ?SourceToken {
    return this.indexOfSourceTokenBetweenPatchersMatching(
      left,
      right,
      token => token.type === SourceType.SEMICOLON
    );
  }

  /**
   * Blocks only exit via the last statement, so we check its code paths.
   */
  allCodePathsPresent(): boolean {
    return this.statements[this.statements.length - 1].allCodePathsPresent();
  }
}
