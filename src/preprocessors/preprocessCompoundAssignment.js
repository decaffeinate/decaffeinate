import getFreeBinding from '../utils/getFreeBinding';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isSafeToRepeat from '../utils/isSafeToRepeat';
import replaceBetween from '../utils/replaceBetween';
import { isDynamicMemberAccessOp, isMemberAccessOp } from '../utils/types';

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
      case 'LogicalAndOp': {
        let lhs = getRepeatableLeftHandSide(node, patcher);
        replaceBetween(patcher, assignee, expression, '=', ` (${lhs} =`);
        patcher.insert(expression.range[1], ')');
        return true;
      }

      case 'ExistsOp': {
        if (isExpressionResultUsed(node)) {
          patcher.insert(node.range[0], 'if ');
          let lhs = getRepeatableLeftHandSide(node, patcher);
          patcher.overwrite(assignee.range[1], expression.range[0], `? then ${lhs} else ${lhs} = `);
        } else {
          patcher.insert(node.range[0], 'unless ');
          let lhs = getRepeatableLeftHandSide(node, patcher);
          patcher.overwrite(assignee.range[1], expression.range[0], `? then ${lhs} = `);
        }
        return true;
      }
    }
  }
}

function getRepeatableLeftHandSide(node, patcher) {
  const { assignee } = node;

  let isMemberAccess = isMemberAccessOp(assignee);
  let isDynamicMemberAccess = isDynamicMemberAccessOp(assignee);
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

  return lhs;
}
