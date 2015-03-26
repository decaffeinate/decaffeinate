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
  if (!node.parent) {
    return false;
  }

  switch (node.parent.type) {
    case 'Block':
      break;

    case 'Function':
      if (node.parent.body !== node) {
        return false;
      }
      break;

    case 'Class':
      return false;

    case 'Conditional':
      if (node.type === 'Block') {
        return false;
      } else if (node.parent.condition === node) {
        return false;
      } else if (isExpressionResultUsed(node.parent)) {
        // No semicolons in "a ? b : c" from "if a then b else c".
        return false;
      }
      break;

    default:
      return false;
  }

  switch (node.type) {
    case 'Conditional':
    case 'ForIn':
    case 'ForOf':
    case 'While':
    case 'Block':
    case 'ClassProtoAssignOp':
    case 'Constructor':
    case 'JavaScript':
      return false;

    case 'Class':
      return !node.nameAssignee || isImplicitlyReturned(node);

    default:
      return true;
  }
}
