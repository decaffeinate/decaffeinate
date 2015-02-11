import isFollowedBy from '../utils/isFollowedBy';
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

    default:
      return false;
  }

  switch (node.type) {
    case 'Conditional':
    case 'ForIn':
    case 'ForOf':
    case 'While':
    case 'Block':
      return false;

    default:
      return true;
  }
}
