import NodePatcher from './NodePatcher';

export default class BlockPatcher extends NodePatcher {
  constructor(node, context, editor, statements) {
    super(node, context, editor);
    this.statements = statements;
    statements.forEach(statement => statement.setStatement(true));
  }

  patch(options={}) {
    const { statements } = this;
    statements.forEach(
      (statement, i) => {
        let isLast = i === statements.length - 1;
        if (options.function && isLast && !statement.returns()) {
          statement.insertAtStart('return ');
          statement.patch({ expression: true });
        } else {
          statement.patch();
        }
        if (this.shouldAppendSemicolonToStatement(statement)) {
          statement.insertAfter(';');
        }
      }
    );
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

    if (tokenAfterStatement.type !== 'TERMINATOR') {
      throw new Error(
        'BUG: unexpected non-terminator following block statement: ' +
        tokenAfterStatement.type
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
      switch (this.slice(i, i + 1)) {
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
}
