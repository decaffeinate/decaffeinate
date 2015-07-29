/**
 * Gets the range of a node when including the parentheses surrounding it.
 *
 * @param {Object} node
 * @param {string} source
 * @returns {number[]}
 */
export default function rangeIncludingParentheses(node, source) {
  let [ start, end ] = node.range;

  while (source[start - 1] === '(' && source[end] === ')') {
    start--;
    end++;
  }

  return [start, end];
}
