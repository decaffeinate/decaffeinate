import getFreeBinding from '../utils/getFreeBinding';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import replaceBetween from '../utils/replaceBetween';

/**
 * Convert special compound assigns that are not direct passthroughs to
 * JavaScript such as `a ||= b`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessCompoundAssignment(node, patcher) {
  if (node.type === 'CompoundAssignOp') {
    const { assignee, expression } = node;

    switch (node.op) {
      case 'LogicalOrOp':
      case 'LogicalAndOp':
        let isMemberAccess = /MemberAccessOp$/.test(assignee.type);
        let isDynamicMemberAccess = assignee.type === 'DynamicMemberAccessOp';
        let lhs;
        let base = isMemberAccess ? assignee.expression.raw : assignee.raw;
        let name = isDynamicMemberAccess ? assignee.indexingExpr.raw :
                   isMemberAccess ? assignee.memberName : null;

        if (isMemberAccess && !isSafeToRepeat(assignee.expression)) {
          base = getFreeBinding(node.scope, 'base');
          patcher.insert(assignee.expression.range[0], `(${base} = `);
          patcher.insert(assignee.expression.range[1], ')');
        }

        if (isDynamicMemberAccess && !isSafeToRepeat(assignee.indexingExpr)) {
          name = getFreeBinding(node.scope, 'name');
          patcher.insert(assignee.indexingExpr.range[0], `${name} = `);
        }

        if (isDynamicMemberAccess) {
          lhs = `${base}[${name}]`;
        } else if (isMemberAccess) {
          lhs = `${base}.${name}`;
        } else {
          lhs = base;
        }

        replaceBetween(patcher, assignee, expression, '=', ` (${lhs} =`);
        patcher.insert(expression.range[1], ')');
        return true;
    }
  }
}

/**
 * Determine whether CoffeeScript would consider repeating the given node to be
 * safe. The reality is that CoffeeScript is a little more cavalier than I would
 * be since even a reference to an unbound variable can have side effects. This
 * reflects what CoffeeScript does so as to maintain behavioral compatibility.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isSafeToRepeat(node) {
  switch (node.type) {
    case 'Identifier':
    case 'Int':
    case 'Float':
      return true;

    case 'MemberAccessOp':
      return isSafeToRepeat(node.expression);

    case 'DynamicMemberAccessOp':
      return isSafeToRepeat(node.expression) && isSafeToRepeat(node.indexingExpr);

    default:
      return false;
  }
}
