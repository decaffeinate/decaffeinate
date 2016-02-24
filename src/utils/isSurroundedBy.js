import findCounterpartCharacter from './findCounterpartCharacter.js';

/**
 * Determines whether a node is surrounded by a matching pair of grouping
 * characters.
 *
 * @param {Object} node
 * @param {string} left
 * @param {string} source
 * @returns {boolean}
 */
export default function isSurroundedBy(node, left, source) {
  if (source[node.range[0] - 1] !== left) {
    return false;
  }

  return findCounterpartCharacter(left, source, node.range[0] - 1) === node.range[1];
}
