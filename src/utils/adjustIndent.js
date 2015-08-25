import determineIndent from './determineIndent';
import getIndent from './getIndent';

/**
 * Adjust an indent in source at a specific offset by an amount.
 *
 * @param {string} source
 * @param {number} offset
 * @param {number} adjustment
 * @returns {string}
 */
export default function adjustIndent(source, offset, adjustment) {
  let currentIndent = getIndent(source, offset);
  let determinedIndent = determineIndent(source);

  if (adjustment > 0) {
    while (adjustment--) {
      currentIndent += determinedIndent;
    }
  } else if (adjustment < 0) {
    currentIndent = currentIndent.slice(determinedIndent.length * -adjustment);
  }

  return currentIndent;
}
