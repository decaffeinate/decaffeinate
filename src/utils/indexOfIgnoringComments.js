import rangesOfNonComments from './rangesOfNonComments.js';

/**
 * Finds a string within source, ignoring any comment strings. Returns -1 if
 * no matching substring can be found.
 *
 * @param {string} source
 * @param {string} string
 * @returns {number}
 */
export default function indexOfIgnoringComments(source, string) {
  let ranges = rangesOfNonComments(source);

  for (let i = 0; i < ranges.length; i++) {
    let { start, end } = ranges[i];
    let index = source.slice(start, end).indexOf(string);
    if (index !== -1) {
      return start + index;
    }
  }

  return -1;
}
