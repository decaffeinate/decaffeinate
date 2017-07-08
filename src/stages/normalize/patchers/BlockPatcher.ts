import { SourceType } from 'coffee-lex';

import NodePatcher from '../../../patchers/NodePatcher';
import getStartOfLine from '../../../utils/getStartOfLine';
import SharedBlockPatcher from './../../../patchers/SharedBlockPatcher';

export default class BlockPatcher extends SharedBlockPatcher {
  patchAsExpression(): void {
    this.patchAsStatement();
  }

  patchAsStatement(): void {
    if (this.node.inline) {
      for (let [i, statement] of this.statements.entries()) {
        statement.patch();
        if (i < this.statements.length - 1) {
          this.normalizeBetweenStatements(statement, this.statements[i + 1]);
        }
      }
      return;
    }

    // Having inconsistent indentation within a block is allowed in some cases
    // when there are implicit function calls, but when function call parens are
    // added, the inconsistent indentation can make the CoffeeScript invalid. So
    // we need to correct any inconsistent indentation in the normalize step so
    // that the result CoffeeScript will always be valid.
    let blockIndentLength = null;
    for (let [i, statement] of this.statements.entries()) {
      let indentLength = this.getIndentLength(statement);
      if (indentLength !== null) {
        if (blockIndentLength === null) {
          blockIndentLength = indentLength;
        } else {
          let charsToRemove = indentLength - blockIndentLength;
          if (charsToRemove < 0) {
            throw this.error(
              'Unexpected statement at an earlier indentation level than an ' +
              'earlier statement in the block.');
          }
          if (charsToRemove > 0) {
            this.removePrecedingSpaceChars(statement.outerStart, charsToRemove);
          }
        }
      }
      statement.patch();
      if (i < this.statements.length - 1) {
        this.normalizeBetweenStatements(statement, this.statements[i + 1]);
      }
    }
  }

  /**
   * Get rid of some number of spaces of indentation before this point in the
   * code. We need to be careful to only remove ranges that have not had any
   * inserts yet, since otherwise we might remove other code in addition to the
   * whitespace, or we might remove too much whitespace.
   */
  removePrecedingSpaceChars(index: number, numToRemove: number): void {
    let numRemaining = numToRemove;
    for (let i = index; numRemaining > 0 && i > 0; i--) {
      let contents = this.slice(i - 1, i);
      if (contents.includes('\n')) {
        throw this.error('Found start of line before removing enough indentation.');
      }
      if (contents === ' ' || contents === '\t') {
        this.remove(i - 1, i);
        numRemaining -= 1;
      }
    }
  }

  /**
   * If this statement starts immediately after its line's initial indentation,
   * return the length of that indentation. Otherwise, return null.
   */
  getIndentLength(statement: NodePatcher): number | null {
    let startOfLine = getStartOfLine(this.context.source, statement.outerStart);
    let indentText = this.context.source.slice(startOfLine, statement.outerStart);
    if (/^[ \t]*$/.test(indentText)) {
      return indentText.length;
    } else {
      return null;
    }
  }

  /**
   * Statements can be comma-separated within classes, which is equivalent to
   * semicolons, so just change them to semicolons.
   */
  normalizeBetweenStatements(leftStatement: NodePatcher, rightStatement: NodePatcher): void {
    let commaTokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      leftStatement, rightStatement, t => t.type === SourceType.COMMA);
    if (!commaTokenIndex) {
      return;
    }
    let commaToken = this.sourceTokenAtIndex(commaTokenIndex);
    if (!commaToken) {
      return;
    }
    this.overwrite(commaToken.start, commaToken.end, ';');
  }
}
