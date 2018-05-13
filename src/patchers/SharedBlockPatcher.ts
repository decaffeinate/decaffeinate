import { SourceType } from 'coffee-lex';

import { Block } from 'decaffeinate-parser/dist/nodes';
import notNull from '../utils/notNull';
import NodePatcher from './NodePatcher';
import { PatcherContext } from './types';

export default class SharedBlockPatcher extends NodePatcher {
  node: Block;
  statements: Array<NodePatcher>;
  shouldPatchInline: boolean | null = null;

  constructor(patcherContext: PatcherContext, statements: Array<NodePatcher>) {
    super(patcherContext);
    this.statements = statements;
  }

  /**
   * Insert statements somewhere in this block.
   */
  insertStatementsAtIndex(statements: Array<string>, index: number): void {
    let separator = this.inline() ? '; ' : ';\n';
    if (index === this.statements.length) {
      let lastStatement = this.statements[this.statements.length - 1];
      let terminatorTokenIndex = this.context.sourceTokens.indexOfTokenMatchingPredicate(
        token => token.type === SourceType.NEWLINE || token.type === SourceType.SEMICOLON,
        lastStatement.outerEndTokenIndex
      );
      let insertionPoint = terminatorTokenIndex
        ? notNull(this.sourceTokenAtIndex(terminatorTokenIndex)).start
        : lastStatement.outerEnd;
      insertionPoint = Math.min(insertionPoint, this.getBoundingPatcher().innerEnd);
      let indent = lastStatement.getIndent();
      statements.forEach(line => {
        let sep = line.trim().startsWith('//') ? '\n' : separator;
        this.insert(insertionPoint, `${sep}${indent}${line}`);
      });
    } else {
      let statementToInsertBefore = this.statements[index];
      let insertionPoint = statementToInsertBefore.outerStart;
      let indent = statementToInsertBefore.getIndent();
      statements.forEach(line => {
        let sep = line.trim().startsWith('//') ? '\n' : separator;
        this.insert(insertionPoint, `${line}${sep}${indent}`);
      });
    }
  }

  /**
   * Insert a statement before the current block. Since blocks can be patched in
   * a number of ways, this needs to handle a few cases:
   * - If it's completely inline, we don't deal with any indentation and just
   *   put a semicolon-separated statement before the start.
   * - If it's a normal non-inline block, we insert the statement beforehand
   *   with the given indentation. However, `this.outerStart` is the first
   *   non-whitespace character of the first line, so it's already indented, so
   *   if we want to add a line with *less* indentation, it's a lot more tricky.
   *   We handle this by walking backward to the previous newline and inserting
   *   a new line from there. This allows the prepended line to have whatever
   *   indentation level we want.
   * - In some cases, such as nontrivial loop expressions with an inline body,
   *   the source CoffeeScript is inline, but we want the result to be
   *   non-inline, so we need to be a lot more careful. The normal non-inline
   *   strategy won't work because there's no newline to walk back to in the
   *   source CoffeeScript, so the strategy is to instead always insert at
   *   `this.outerStart`. That means that the indentation for the actual body
   *   needs to be done later, just before the body itself is patched. See the
   *   uses of shouldConvertInlineBodyToNonInline in LoopPatcher for an example.
   */
  insertLineBefore(statement: string, indent: string = this.getIndent()): void {
    if (this.inline()) {
      this.insert(this.outerStart, `${statement}; `);
    } else if (this.node.inline) {
      this.insert(this.outerStart, `${indent}${statement};\n`);
    } else {
      let insertIndex = this.outerStart;
      while (insertIndex > 0 && this.context.source[insertIndex] !== '\n') {
        insertIndex--;
      }
      this.insert(insertIndex, `\n${indent}${statement};`);
    }
  }

  insertLineAfter(statement: string, indent: string): void {
    if (this.inline()) {
      this.insert(this.outerEnd, `; ${statement}`);
    } else {
      this.insert(this.outerEnd, `\n${indent}${statement};`);
    }
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    if (this.shouldPatchInline !== null) {
      return this.shouldPatchInline;
    }
    return this.node.inline;
  }
}
