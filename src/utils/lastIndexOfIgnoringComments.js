import rangesOfNonComments from './rangesOfNonComments.js';

/**
 * Finds the last index of a string inside source code ignoring comments.
 * Returns -1 if no match is found.
 *
 * @param {string} source
 * @param {string} string
 * @param {number=} fromIndex
 * @returns {number}
 */
export default function lastIndexOfIgnoringComments(source, string, fromIndex=source.length) {
  let ranges = rangesOfNonComments(source);

  for (let i = ranges.length - 1; i >= 0; i--) {
    let { start, end } = ranges[i];
    if (fromIndex < start) { continue; }
    let index = source.slice(start, end).lastIndexOf(string, fromIndex - start);
    if (index !== -1) {
      return start + index;
    }
  }

  return -1;
}
