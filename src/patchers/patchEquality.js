import replaceBetween from '../utils/replaceBetween';

/**
 * Replaces equality operators with strict equality operators.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchEquality(node, patcher) {
  switch (node.type) {
    case 'EQOp':
      replaceBetween(patcher, node.left, node.right, '==', '===') ||
        replaceBetween(patcher, node.left, node.right, 'is', '===');
      break;

    case 'NEQOp':
      replaceBetween(patcher, node.left, node.right, '!=', '!==') ||
        replaceBetween(patcher, node.left, node.right, 'isnt', '!==');
      break;
  }
}
