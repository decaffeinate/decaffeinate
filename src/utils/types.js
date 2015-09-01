/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isFunction(node) {
  return node.type === 'Function' || node.type === 'BoundFunction';
}
