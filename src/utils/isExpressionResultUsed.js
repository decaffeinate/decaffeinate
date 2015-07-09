import isImplicitlyReturned from './isImplicitlyReturned';

/**
 * Determines whether a node's resulting value could be used.
 *
 * @param {Object?} node
 * @returns {boolean}
 */
export default function isExpressionResultUsed(node) {
  if (!node) {
    return false;
  }

  if (node.parentNode.type === 'Conditional' && node.parentNode.alternate === node) {
    return false;
  }

  if (node.parentNode.type !== 'Block') {
    return true;
  }

  return isImplicitlyReturned(node);
}
