import isFollowedBy from '../utils/isFollowedBy';
import shouldHaveTrailingSemicolon from '../utils/shouldHaveTrailingSemicolon';
import trimmedNodeRange from '../utils/trimmedNodeRange';
import { isFunction } from '../utils/types';

/**
 * Adds semicolons after statements that should have semicolons.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSemicolons(node, patcher) {
  if (shouldHaveTrailingSemicolon(node) && !isFunction(node)) {
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

