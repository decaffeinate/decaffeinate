/* @flow */

/**
 * Removes indentation shared by all lines.
 */
export default function stripSharedIndent(source: string): string {
  let indents = getIndentInfo(source);
  let minimumIndent = sharedIndentSize(indents.ranges);
  let lines = source.slice(indents.leadingMargin, source.length - indents.trailingMargin).split('\n');
  return lines.map(line => line.slice(minimumIndent)).join('\n');
}

export function getIndentInfo(source: string, start: number=0, end: number=source.length): { leadingMargin: number, trailingMargin: number, ranges: Array<[number, number]> } {
  let ranges = [];

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

export function sharedIndentSize(ranges: Array<[number, number]>): number {
  let size = null;

  ranges.forEach(([start, end]) => {
    if (size === null || (start !== end && end - start < size)) {
      size = end - start;
    }
  });

  return size === null ? 0 : size;
}
