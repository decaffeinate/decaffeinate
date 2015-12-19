/**
 * Gets the range of a node when including the parentheses surrounding it.
 *
 * @param {number[]} range
 * @param {string} source
 * @returns {number[]}
 */
export default function rangeIncludingParentheses(range, source) {
  let [ start, end ] = range;

  while (source[start - 1] === '(' && source[end] === ')') {
    start--;
    end++;
  }

  return [start, end];
}
