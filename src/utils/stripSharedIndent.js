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

  const minimumIndent = lines.reduce((indent, line) => {
    if (line.length === 0) {
      return indent;
    } else {
      return Math.min(getIndent(line), indent);
    }
  }, Infinity);

  return lines.map(line => line.slice(minimumIndent)).join('\n');
}

/**
 * Determines the indentation in number of spaces of a line.
 *
 * @param {string} line
 * @returns {number}
 */
function getIndent(line) {
  let index = 0;
  while (line[index] === ' ') {
    index++;
  }
  return index;
}
