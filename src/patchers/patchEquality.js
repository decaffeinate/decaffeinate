import replaceBetween from '../utils/replaceBetween';

/**
 * Replaces equality operators with strict equality operators.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchEquality(node, patcher) {
  if (node.type === 'EQOp') {
    replaceBetween(patcher, node.left, node.right, '==', '===') ||
      replaceBetween(patcher, node.left, node.right, 'is', '===');
  }
}
