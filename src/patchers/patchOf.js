import replaceBetween from '../utils/replaceBetween';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchOf(node, patcher) {
  if (node.type === 'OfOp') {
    replaceBetween(patcher, node.left, node.right, 'of', 'in');
  }
}