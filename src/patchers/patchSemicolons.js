import isFollowedBy from '../utils/isFollowedBy';

/**
 * Adds semicolons after statements that should have semicolons.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSemicolons(node, patcher) {
  if (shouldHaveTrailingSemicolon(node)) {
    if (!isFollowedBy(node, patcher.original, ';')) {
      patcher.insert(node.range[1], ';');
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
  if (!node.parent || node.parent.type !== 'Block') {
    return false;
  }

  switch (node.type) {
    case 'Conditional':
    case 'ForIn':
    case 'ForOf':
    case 'While':
      return false;

    default:
      return true;
  }
}
