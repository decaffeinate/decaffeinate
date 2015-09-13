export function patchObjectBraceOpening(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parentNode.type !== 'FunctionApplication') {
    if (patcher.original[node.range[0]] !== '{') {
      patcher.insert(node.range[0], isObjectAsStatement(node) ? '({' : '{');
    } else if (isObjectAsStatement(node)) {
      patcher.insert(node.range[0], '(');
    }
  } else if (node.type === 'ObjectInitialiserMember' && node.expression.type === 'Function') {
    patcher.overwrite(node.key.range[1], node.expression.range[0], '');
  }
}

/**
 * @param node
 * @param patcher
 */
export function patchObjectBraceClosing(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parentNode.type !== 'FunctionApplication') {
    if (patcher.original[node.range[0]] !== '{') {
      patcher.insert(node.range[1], isObjectAsStatement(node) ? '})' : '}');
    } else if (isObjectAsStatement(node)) {
      patcher.insert(node.range[1], ')');
    }
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function isObjectAsStatement(node) {
  if (node.parentNode.type !== 'Block') {
    return false;
  }

  if (node.parentNode.parentNode.type === 'Function' || node.parentNode.parentNode.type === 'BoundFunction') {
    // If it's the last statement then it's an implicit return.
    const statements = node.parentNode.statements;
    return statements[statements.length - 1] !== node;
  }

  return true;
}
