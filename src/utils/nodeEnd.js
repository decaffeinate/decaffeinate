/**
 * Mark the index which denotes the end of the node, i.e. the place where any
 * new content should go.
 *
 * @param {Object} node
 * @param {number} index
 */
export function markNodeEnd(node, index) {
  node._end = index;
  let parentNode = node;
  while ((parentNode = parentNode.parentNode)) {
    parentNode._end = index;
  }
}

/**
 * Gets the end index of the node, i.e. the place where any new content should
 * go.
 *
 * @param {Object} node
 * @returns {number}
 */
export function getNodeEnd(node) {
  return ('_end' in node) ? node._end : node.range[1];
}
