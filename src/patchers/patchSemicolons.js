import isFollowedBy from '../utils/isFollowedBy';
import rangeIncludingParentheses from '../utils/rangeIncludingParentheses';
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
    const source = patcher.original;
    if (!isFollowedBy(node, source, ';')) {
      patcher.insert(
        rangeIncludingParentheses(trimmedNodeRange(node, source), source)[1],
        ';'
      );
    }
  }
}

