import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

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

    let { statements } = this;
    statements.forEach(
      statement => {
        if (statement.implicitlyReturns() && !statement.explicitlyReturns()) {
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
          this.insert(statement.after, ',');
        }
      }
    );
    if (rightBrace) {
      this.insertAfter(')');
    }
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    return this.node.inline;
  }
}
