import rangesOfComments from './rangesOfComments.js';

/**
 * Returns the ranges of the sections of source code that are not comments.
 *
 * @param {string} source
 * @returns {Array.<{start: number, end: number}>}
 */
export default function rangesOfNonComments(source) {
  let index = 0;
  let ranges = [];

  rangesOfComments(source).forEach(({ start, end }) => {
    if (start !== index) {
      ranges.push({ start: index, end: start });
    }
    index = end;
  });

  if (index < source.length) {
    ranges.push({ start: index, end: source.length });
  }

  return ranges;
}
