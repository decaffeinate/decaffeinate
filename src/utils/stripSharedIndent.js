const WHITESPACE = /^\s*$/;

/**
 * Removes indentation shared by all lines.
 *
 * @param {string} source
 * @returns {string}
 */
export default function stripSharedIndent(source) {
  const lines = source.split('\n');

  while (lines.length > 0 && WHITESPACE.test(lines[0])) {
    lines.shift();
  }
  while (lines.length > 0 && WHITESPACE.test(lines[lines.length - 1])) {
    lines.pop();
  }

  const minimumIndent = sharedIndentSize(indentRanges(lines.join('\n')));
  return lines.map(line => line.slice(minimumIndent)).join('\n');
}

/**
 * @param {string} source
 * @param {number=} start
 * @param {number=} end
 * @returns {Array<Array<number>>}
 */
export function indentRanges(source, start=0, end=source.length) {
  const ranges = [];

  for (let index = start; index < end; index++) {
    if (index === start || source[index - 1] === '\n') {
      if (source[index] !== '\n') {
        let start = index;
        while (source[index] === ' ') {
          index++;
        }
        ranges.push([start, index]);
      }
    }
  }

  return ranges;
}

/**
 * @param {Array<Array<number>>} ranges
 * @returns {number}
 */
export function sharedIndentSize(ranges) {
  let size = null;

  ranges.forEach(([start, end]) => {
    if (size === null || (start !== end && end - start < size)) {
      size = end - start;
    }
  });

  return size === null ? 0 : size;
}
