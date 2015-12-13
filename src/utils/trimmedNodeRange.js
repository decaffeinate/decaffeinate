const NORMAL = 1;
const COMMENT = 2;
const DSTRING = 3;
const SSTRING = 4;
const TDSTRING = 5;
const TSSTRING = 6;
const REGEXP = 7;
const HEREGEXP = 8;

function newlineTerminatesState(state) {
  switch (state) {
    case TDSTRING:
    case TSSTRING:
    case HEREGEXP:
      return false;

    default:
      return true;
  }
}

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
        if (newlineTerminatesState(state)) {
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
          if (hasNext('"""')) {
            state = TDSTRING;
            index += '""'.length;
          } else {
            state = DSTRING;
          }
        } else if (state === DSTRING) {
          state = NORMAL;
          lastSignificantIndex = index;
        } else if (state === TDSTRING) {
          if (hasNext('"""')) {
            state = NORMAL;
            index += '""'.length;
            lastSignificantIndex = index;
          }
        }
        break;

      case "'":
        if (state === NORMAL) {
          if (hasNext("'''")) {
            state = TSSTRING;
            index += "''".length;
          } else {
            state = SSTRING;
          }
        } else if (state === SSTRING) {
          state = NORMAL;
          lastSignificantIndex = index;
        } else if (state === TSSTRING) {
          if (hasNext("'''")) {
            state = NORMAL;
            index += "''".length;
            lastSignificantIndex = index;
          }
        }
        break;

      case '/':
        if (state === NORMAL) {
          if (hasNext('///')) {
            state = HEREGEXP;
            index += '//'.length;
          } else if (!hasNext(/^\/=?\s/)) {
            // Heuristic to differentiate from division operator
            state = REGEXP;
          } else {
            lastSignificantIndex = index;
          }
        } else if (state === REGEXP) {
          state = NORMAL;
          lastSignificantIndex = index;
        } else if (state === HEREGEXP) {
          if (hasNext('///')) {
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

  function hasNext(value) {
    if (typeof value === 'string') {
      return source.slice(index, index + value.length) === value;
    } else {
      return value.test(source.slice(index));
    }
  }

  return [range[0], lastSignificantIndex + 1];
}
