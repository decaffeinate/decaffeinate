import determineIndent from '../utils/determineIndent';
import prependLinesToBlock from '../utils/prependLinesToBlock';

export default function preprocessClass(node, patcher) {
  if (node.type === 'Class') {
    const bindings = [];

    if (node.boundMembers.length > 0) {
      const indent = determineIndent(patcher.original);

      node.body.statements.forEach(statement => {
        if (statement.type === 'ClassProtoAssignOp' && statement.expression.type === 'BoundFunction') {
          const { assignee, expression } = statement;
          bindings.push(`this.${assignee.data} = this.${assignee.data}.bind(this)`);
          patcher.overwrite(expression.range[0], expression.range[0] + '=>'.length, '->');
        }
      });

      if (node.ctor) {
        prependLinesToBlock(patcher, bindings, node.ctor.expression.body);
      } else {
        const constructor = ['constructor: ->'];
        if (node.parent) {
          // FIXME: CSR does not actually support `super` yet!
          constructor.push(`${indent}super()`);
        }
        constructor.push(...bindings.map(binding => indent + binding), '');
        prependLinesToBlock(patcher, constructor, node.body);
      }

      return true;
    }
  }
}
