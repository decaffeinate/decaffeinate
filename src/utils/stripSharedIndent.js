/**
 * Removes indentation shared by all lines.
 *
 * @param {string} source
 * @returns {string}
 */
export default function stripSharedIndent(source) {
  const indents = getIndentInfo(source);
  const minimumIndent = sharedIndentSize(indents.ranges);
  const lines = source.slice(indents.leadingMargin, source.length - indents.trailingMargin).split('\n');
  return lines.map(line => line.slice(minimumIndent)).join('\n');
}

/**
 * @param {string} source
 * @param {number=} start
 * @param {number=} end
 * @returns {{leadingMargin: number, trailingMargin: number, ranges: Array<Array<number>>}}
 */
export function getIndentInfo(source, start=0, end=source.length) {
  const ranges = [];

  let leadingMargin = 0;
  while (source[start + leadingMargin] === ' ') {
    leadingMargin += ' '.length;
  }
  if (source[start + leadingMargin] === '\n') {
    leadingMargin += '\n'.length;
    start += leadingMargin;
  }

  let trailingMargin = 0;
  while (source[end - trailingMargin - ' '.length] === ' ') {
    trailingMargin += ' '.length;
  }
  if (source[end - trailingMargin - '\n'.length] === '\n') {
    trailingMargin += '\n'.length;
    end -= trailingMargin;
  }

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

  return {
    leadingMargin,
    trailingMargin,
    ranges
  };
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
