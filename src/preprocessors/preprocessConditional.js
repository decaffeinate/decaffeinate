import makeIIFE from '../utils/makeIIFE';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isMultiline from '../utils/isMultiline';
import sourceBetween from '../utils/sourceBetween';

/**
 * Rewrites POST `if` and `unless` conditionals to be PRE conditionals. Returns
 * whether or not any rewrites happened for the given node.
 *
 * @example
 *
 *   a if b  # => if b then a
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessConditional(node, patcher) {
  if (node.type === 'Conditional') {
    const { condition } = node;
    const { consequent } = node;
    if (condition.range[0] > consequent.range[0]) {
      // Found a POST-if/unless, transform it.
      let ifOrUnlessToken = sourceBetween(patcher.original, consequent, condition).trim();
      patcher.overwrite(node.range[0], node.range[1], `${ifOrUnlessToken} ${condition.raw.trim()} then ${consequent.raw.trim()}`);
      return true;
    } else if (isExpressionResultUsed(node) && isMultiline(patcher.original, node)) {
      makeIIFE(node, patcher);
      return true;
    }
  }
}
