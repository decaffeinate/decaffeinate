import NodePatcher from './NodePatcher';

export default class BlockPatcher extends NodePatcher {
  constructor(node, context, editor, statements) {
    super(node, context, editor);
    this.statements = statements;
    statements.forEach(statement => statement.setStatement(true));
  }

  patch(options={}) {
    let { leftBrace=true, rightBrace=true } = options;

    if (leftBrace) {
      this.insertBefore('{');
    }

    let { statements } = this;
    statements.forEach(
      (statement, i) => {
        let isLast = i === statements.length - 1;
        if (options.function && isLast && !statement.returns()) {
          statement.return();
          statement.patch({ expression: true });
        } else {
          statement.patch();
        }
        // FIXME: Implicit returns may have different semicolon needs.
        if (statement.statementNeedsSemicolon() && this.shouldAppendSemicolonToStatement(statement)) {
          statement.insertAfter(';');
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

  /**
   * @private
   */
  shouldAppendSemicolonToStatement(statement: NodePatcher): boolean {
    let { context } = this;
    let tokenAfterStatement = context.tokenAtIndex(statement.lastTokenIndex + 1);

    if (!tokenAfterStatement) {
      return true;
    }

    switch (tokenAfterStatement.type) {
      case 'TERMINATOR':
        break;

      case 'OUTDENT':
        // CoffeeScript does not insert a TERMINATOR before an OUTDENT.
        return true;

      default:
        throw new Error(
          `BUG: unexpected non-terminator following ${statement.node.type} ` +
          `statement: ${tokenAfterStatement.type}`
        );
    }

    if (tokenAfterStatement.data === ';') {
      return false;
    }

    // CoffeeScript ignores ';' in ';\n', generating a token for '\n' instead,
    // so this terminator may actually be preceded by a semicolon. Let's just
    // look at characters following the end.
    let i = statement.after;
    for (;;) {
      switch (context.source.slice(i, i + 1)) {
        case ' ':
        case '\t':
          i++;
          break;

        case ';':
          return false;

        default:
          return true;
      }
    }
  }

  /**
   * Blocks never have semicolons after them.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }

  /**
   * Gets whether this patcher's block is inline (on the same line as the node
   * that contains it) or not.
   */
  inline(): boolean {
    return this.node.inline;
  }
}
