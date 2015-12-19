import appendToNode from '../utils/appendToNode';
import isFollowedBy from '../utils/isFollowedBy';
import rangeIncludingParentheses from '../utils/rangeIncludingParentheses';
import shouldHaveTrailingSemicolon from '../utils/shouldHaveTrailingSemicolon';
import trimmedNodeRange from '../utils/trimmedNodeRange';
import { getNodeEnd } from '../utils/nodeEnd';

/**
 * Adds semicolons after statements that should have semicolons.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSemicolons(node, patcher) {
  if (shouldHaveTrailingSemicolon(node)) {
    const source = patcher.original;
    if (!isFollowedBy(node, source, ';')) {
      const expectedInsertionPoint = rangeIncludingParentheses(trimmedNodeRange(node, source), source)[1];
      const insertionPoint = Math.max(getNodeEnd(node), expectedInsertionPoint);
      appendToNode(node, patcher, ';', insertionPoint);
    }
  }
}

