import isFollowedBy from '../utils/isFollowedBy';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isImplicitlyReturned from '../utils/isImplicitlyReturned';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Adds semicolons after statements that should have semicolons.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSemicolons(node, patcher) {
  if (shouldHaveTrailingSemicolon(node)) {
    if (!isFollowedBy(node, patcher.original, ';')) {
      const nodeRange = trimmedNodeRange(node, patcher.original);
      while (patcher.original[nodeRange[0]] === '(' && patcher.original[nodeRange[1]] === ')') {
        nodeRange[0]--;
        nodeRange[1]++;
      }
      patcher.insert(nodeRange[1], ';');
    }
  }
}

/**
 * Determines whether a node should have a semicolon after it.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function shouldHaveTrailingSemicolon(node) {
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
      return false;

    case 'Class':
      return !node.nameAssignee || isImplicitlyReturned(node);

    default:
      return true;
  }
}
