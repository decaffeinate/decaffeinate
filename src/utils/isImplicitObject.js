/**
 * @param {Object} node
 * @param {string} source
 * @returns {boolean}
 */
export default function isImplicitObject(node, source) {
  return node && node.type === 'ObjectInitialiser' && source[node.range[0]] !== '{';
}
