import isImplicitlyReturned from './isImplicitlyReturned.js';
import { isConsequentOrAlternate } from './types.js';

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

  if ('_expression' in node) {
    return node._expression;
  }

  if (isConsequentOrAlternate(node)) {
    return false;
  }

  const { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  if (parentNode.type === 'AssignOp') {
    return node === parentNode.expression;
  }

  if (parentNode.type === 'Function' && parentNode.parameters.indexOf(node) >= 0) {
    return false;
  }

  if (parentNode.type !== 'Block') {
    return true;
  }

  return isImplicitlyReturned(node);
}
