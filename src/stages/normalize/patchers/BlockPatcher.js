import NodePatcher from './../../../patchers/NodePatcher';
import getStartOfLine from '../../../utils/getStartOfLine';

import type { PatcherContext } from './../../../patchers/types';

export default class BlockPatcher extends NodePatcher {
  statements: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, statements: Array<NodePatcher>) {
    super(patcherContext);
    this.statements = statements;
  }

  patchAsExpression() {
    this.patchAsStatement();
  }

  patchAsStatement() {
    if (this.node.inline) {
      for (let statement of this.statements) {
        statement.patch();
      }
      return;
    }

    // Having inconsistent indentation within a block is allowed in some cases
    // when there are implicit function calls, but when function call parens are
    // added, the inconsistent indentation can make the CoffeeScript invalid. So
    // we need to correct any inconsistent indentation in the normalize step so
    // that the result CoffeeScript will always be valid.
    let blockIndentLength = null;
    for (let statement of this.statements) {
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
            this.remove(statement.outerStart - charsToRemove, statement.outerStart);
          }
        }
      }
      statement.patch();
    }
  }

  /**
   * If this statement starts immediately after its line's initial indentation,
   * return the length of that indentation. Otherwise, return null.
   */
  getIndentLength(statement) {
    let startOfLine = getStartOfLine(this.context.source, statement.outerStart);
    let indentText = this.context.source.slice(startOfLine, statement.outerStart);
    if (/^[ \t]*$/.test(indentText)) {
      return indentText.length;
    } else {
      return null;
    }
  }
}
