/**
 * @param {Object} node
 * @returns {boolean}
 */
export default function isParameter(node) {
  if (!node) {
    return false;
  }

  const { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  if (parentNode.type !== 'Function' && parentNode.type !== 'BoundFunction') {
    return false;
  }

  return parentNode.parameters.indexOf(node) >= 0;
}
