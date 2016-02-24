import NodePatcher from './NodePatcher';
import type { Token, Node, ParseContext, Editor } from './types';

export default class BlockPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, statements: Array<NodePatcher>) {
    super(node, context, editor);
    this.statements = statements;
  }

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

  patchAsStatement({ leftBrace=true, rightBrace=true }={}) {
    if (leftBrace) {
      this.insertBefore('{');
    }

    this.statements.forEach(
      statement => {
        if (statement.implicitlyReturns() && !statement.explicitlyReturns()) {
          statement.setRequiresExpression();
          this.insert(statement.before, 'return ');
        }
        statement.patch();
        if (statement.statementNeedsSemicolon()) {
          this.insert(statement.after, ';');
        }
      }
    );

    if (rightBrace) {
      if (this.inline()) {
        this.insertAfter(' }');
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
      this.insertBefore('(');
    }
    this.statements.forEach(
      (statement, i, statements) => {
        statement.patch();
        if (i !== statements.length - 1) {
          let semicolonToken = this.getSemicolonTokenBetween(
            statement,
            statements[i + 1]
          );
          if (semicolonToken) {
            this.overwrite(...semicolonToken.range, ',');
          } else {
            this.insert(statement.after, ',');
          }
        }
      }
    );
    if (rightBrace) {
      this.insertAfter(')');
    }
  }

  /**
   * Insert lines somewhere in this block.
   */
  insertLinesAtIndex(lines: Array<string>, index: number) {
    if (index === this.statements.length) {
      let lastStatement = this.statements[this.statements.length - 1];
      let insertionPoint = this.context.source.indexOf('\n', lastStatement.after);
      if (insertionPoint < 0) {
        insertionPoint = lastStatement.after;
      }
      let indent = lastStatement.getIndent();
      lines.forEach(line => this.insert(insertionPoint, `\n${indent}${line}`));
    } else {
      let statementToInsertBefore = this.statements[index];
      let insertionPoint = statementToInsertBefore.before;
      let indent = statementToInsertBefore.getIndent();
      lines.forEach(line => this.insert(insertionPoint, `${line}\n${indent}`));
    }
  }

  /**
   * @private
   */
  getSemicolonTokenBetween(left: NodePatcher, right: NodePatcher): ?Token {
    return this.tokenBetweenPatchersMatching(left, right, 'TERMINATOR', ';');
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    return this.node.inline;
  }
}
