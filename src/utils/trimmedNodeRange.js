const COMMENT = 1;
const DSTRING = 2;
const NORMAL = 3;
const SSTRING = 4;
const REGEXP = 5;
const HEREGEXP = 6;

/**
 * Gets the range of the node by trimming whitespace and comments off the end.
 * CoffeeScriptRedux parses nodes by consuming up until the start of the next
 * node, so any whitespace or comments following a node end up as part of its
 * range. This tries to remove those trailing whitespace and comments.
 *
 * @param {Object} node
 * @param {string} source
 * @returns {number[]}
 */
export default function trimmedNodeRange(node, source) {
  const range = node.range;
  let index = range[0];
  let state = NORMAL;
  let lastSignificantIndex;
  while (range[0] <= index && index < range[1]) {
    switch (source[index]) {
      case ' ':
      case '\t':
        break;

      case '\n':
      case '\r':
        if (state !== HEREGEXP) {
          state = NORMAL;
        }
        break;

      case '#':
        if (state === NORMAL) {
          state = COMMENT;
        }
        break;

      case '"':
        if (state === NORMAL) {
          state = DSTRING;
          lastSignificantIndex = index;
        } else if (state === DSTRING) {
          state = NORMAL;
          lastSignificantIndex = index;
        }
        break;

      case "'":
        if (state === NORMAL) {
          state = SSTRING;
          lastSignificantIndex = index;
        } else if (state === SSTRING) {
          state = NORMAL;
          lastSignificantIndex = index;
        }
        break;

      case '/':
        if (state === NORMAL) {
          if (source.slice(index, index + '///'.length) === '///') {
            state = HEREGEXP;
            index += '//'.length;
          } else if (!source.slice(index).match(/^\/=?\s/)) {
            // Heuristic to differentiate from division operator
            state = REGEXP;
          } else {
            lastSignificantIndex = index;
          }
        } else if (state === REGEXP) {
          state = NORMAL;
          lastSignificantIndex = index;
        } else if (state === HEREGEXP) {
          if (source.slice(index, index + '///'.length) === '///') {
            state = NORMAL;
            index += '//'.length;
            lastSignificantIndex = index;
          }
        }
        break;

      case '\\':
        // The next character is escaped and should not be considered special.
        index++;
        break;

      default:
        if (state === NORMAL) {
          lastSignificantIndex = index;
        }
        break;
    }

    index++;
  }

  return [range[0], lastSignificantIndex + 1];
}
