import findCounterpartCharacter from './findCounterpartCharacter';

/**
 * Determines whether a string is surrounded by a matching pair of grouping
 * characters.
 *
 * @param {string} string
 * @param {string} left
 * @returns {boolean}
 */
export default function isSurroundedBy(string, left) {
  if (string.lastIndexOf(left, 0) < 0) {
    return false;
  }

  return findCounterpartCharacter(left, string) === string.length - 1;
}
