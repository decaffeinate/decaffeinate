import sourceBetween from './sourceBetween.js';

/**
 * Replace part of the text between the given nodes with a new string.
 *
 * @param {MagicString} patcher
 * @param {Object} left
 * @param {Object} right
 * @param {string} search
 * @param {string} replacement
 * @returns {boolean}
 */
export default function replaceBetween(patcher, left, right, search, replacement) {
  let between = sourceBetween(patcher.original, left, right);
  let offset = between.indexOf(search);

  if (offset < 0) {
    return false;
  }

  patcher.overwrite(left.range[1] + offset, left.range[1] + offset + search.length, replacement);
  return true;
}
