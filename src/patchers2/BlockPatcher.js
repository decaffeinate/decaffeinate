import NodePatcher from './NodePatcher';

export default class BlockPatcher extends NodePatcher {
  constructor(node, context, editor, statements) {
    super(node, context, editor);
    this.statements = statements;
    statements.forEach(statement => statement.setStatement(true));
  }

  patch(options={}) {
    const { statements, context } = this;
    statements.forEach(
      (statement, i) => {
        console.log(statement);
        let isLast = i === statements.length - 1;
        if (options.function && isLast && !statement.returns()) {
          statement.prepend('return ');
          statement.patch({ expression: true });
        } else {
          statement.patch();
        }
        let needsSemicolon = true;
        if (!isLast) {
          let tokensBetweenStatements = context.tokensBetweenNodes(
            statement.node,
            statements[i + 1].node
          );
          if (tokensBetweenStatements.some(({ data }) => data === ';')) {
            needsSemicolon = false;
          }
        }
        if (needsSemicolon) {
          statement.append(';');
        }
      }
    );
  }
}
