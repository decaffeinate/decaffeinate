/**
 * Determines whether the given node is a statement.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export default function isStatement(node) {
  if (!node || !node.parentNode) {
    return false;
  }

  if (node.parentNode.type !== 'Block') {
    return false;
  }

  if (node.parentNode.parentNode.type === 'Function' || node.parentNode.parentNode.type === 'BoundFunction') {
    // If it's the last statement then it's an implicit return.
    const statements = node.parentNode.statements;
    return statements[statements.length - 1] !== node;
  }

  // It's inside a block, but not the last statement of a function,
  // so it's a statement.
  return true;
}
