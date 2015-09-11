/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isFunction(node) {
  return node.type === 'Function' || node.type === 'BoundFunction';
}

/**
 * Determines whether a node represents a `for` loop.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isForLoop(node) {
  return node.type === 'ForIn' || node.type === 'ForOf';
}

/**
 * Determines whether a node represents a `while` loop.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isWhile(node) {
  return node.type === 'While';
}
