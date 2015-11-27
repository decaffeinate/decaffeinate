const NORMAL = 0;
const LINE_COMMENT = 1;
const BLOCK_COMMENT = 2;
const DQUOTE = 3;
const SQUOTE = 4;
const FORWARD_SLASH = 5;

const NEWLINE_CODE = 10;
const HASH_CODE = 35;
const DQUOTE_CODE = 34;
const SQUOTE_CODE = 39;
const BACKWARD_SLASH = 92;
const FORWARD_SLASH_CODE = 47;

/**
 * Returns the ranges of the sections of source code that are not comments.
 *
 * @param {string} source
 * @returns {Array.<{start: number, end: number, type: string}>}
 */
export default function rangesOfComments(source) {
  var result = [];
  var index = 0;
  var end = source.length;
  var state = 0;

  var rangeStart = 0;

  while (index < end) {
    var c = source.charCodeAt(index);

    switch (state) {
      case NORMAL:
        if (c === HASH_CODE) {
          rangeStart = index;
          if (source.slice(index, index + 4) === '###\n') {
            state = BLOCK_COMMENT;
            index += 3;
          } else {
            state = LINE_COMMENT;
          }
        } else if (c === DQUOTE_CODE) {
          state = DQUOTE;
        } else if (c === SQUOTE_CODE) {
          state = SQUOTE;
        } else if (
          c === FORWARD_SLASH_CODE &&
          (source.slice(index, index + 3) === '///'
            // Heuristic to differentiate from division operator
            || !source.slice(index).match(/^\/=?\s/)
          )
        ) {
          state = FORWARD_SLASH;
        }
        break;

      case LINE_COMMENT:
        if (c === NEWLINE_CODE) {
          addComment();
          state = NORMAL;
        }
        break;

      case BLOCK_COMMENT:
        if (c === HASH_CODE) {
          if (source.slice(index, index + 4) === '###\n') {
            index += 3;
            addComment();
            state = NORMAL;
          } else if (source.slice(index, index + 4) === '###' /* EOF */) {
            index += 3;
            addComment();
            state = NORMAL;
          }
        }
        break;

      case DQUOTE:
        if (c === DQUOTE_CODE) {
          state = NORMAL;
        } else if (c === BACKWARD_SLASH) {
          index++;
        }
        break;

      case SQUOTE:
        if (c === SQUOTE_CODE) {
          state = NORMAL;
        } else if (c === BACKWARD_SLASH) {
          index++;
        }
        break;

      case FORWARD_SLASH:
        if (c === FORWARD_SLASH_CODE) {
          state = NORMAL;
        }
        break;
    }

    index++;
  }

  if (state === LINE_COMMENT || state === BLOCK_COMMENT) {
    addComment();
  }

  function addComment() {
    let type;

    // Check for shebang lines.
    if (state === BLOCK_COMMENT) {
      type = 'block';
    } else if (rangeStart === 0 && source[1] === '!') {
      type = 'shebang';
    } else {
      type = 'line';
    }

    result.push({ start: rangeStart, end: index, type });
  }

  return result;
}
