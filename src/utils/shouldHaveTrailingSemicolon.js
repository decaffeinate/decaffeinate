import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isImplicitlyReturned from '../utils/isImplicitlyReturned';

/**
 * Determines whether a node should have a semicolon after it.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export default function shouldHaveTrailingSemicolon(node) {
  if (!node.parentNode) {
    return false;
  }

  switch (node.parentNode.type) {
    case 'Block':
      break;

    case 'Function':
      if (node.parentNode.body !== node) {
        return false;
      }
      break;

    case 'Class':
      return false;

    case 'Conditional':
      if (node.type === 'Block') {
        return false;
      } else if (node.parentNode.condition === node) {
        return false;
      } else if (isExpressionResultUsed(node.parentNode)) {
        // No semicolons in "a ? b : c" from "if a then b else c".
        return false;
      }
      break;

    default:
      return false;
  }

  switch (node.type) {
    case 'Block':
    case 'ClassProtoAssignOp':
    case 'Conditional':
    case 'Constructor':
    case 'ForIn':
    case 'ForOf':
    case 'JavaScript':
    case 'Try':
    case 'While':
    case 'Switch':
      return false;

    case 'Class':
      return !node.nameAssignee || isImplicitlyReturned(node);

    default:
      return true;
  }
}
