import isPrecededBy from '../utils/isPrecededBy';

export function patchObjectBraceOpening(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parent.type !== 'FunctionApplication') {
    if (patcher.original[node.range[0]] !== '{') {
      patcher.insert(node.range[0], isObjectAsStatement(node) ? '({' : '{');
    } else if (isObjectAsStatement(node)) {
      patcher.insert(node.range[0], '(');
    }
  }
}

/**
 * @param node
 * @param patcher
 */
export function patchObjectBraceClosing(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parent.type !== 'FunctionApplication') {
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
  if (node.parent.type !== 'Block') {
    return false;
  }

  if (node.parent.parent.type === 'Function' || node.parent.parent.type === 'BoundFunction') {
    // If it's the last statement then it's an implicit return.
    const statements = node.parent.statements;
    return statements[statements.length - 1] !== node;
  }

  return true;
}
