import isImplicitlyReturned from './isImplicitlyReturned';
import { isConsequentOrAlternate } from './types';

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

  if (node._expression) {
    return true;
  }

  if (isConsequentOrAlternate(node)) {
    return false;
  }

  const { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  if (parentNode.type === 'Function' && parentNode.parameters.indexOf(node) >= 0) {
    return false;
  }

  if (parentNode.type !== 'Block') {
    return true;
  }

  return isImplicitlyReturned(node);
}
