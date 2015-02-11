const NORMAL = 0;
const LINE_COMMENT = 1;
const BLOCK_COMMENT = 5;
const NEWLINE_CODE = 10;
const HASH_CODE = 35;

/**
 * @param {string} source
 * @returns {string}
 */
export default function stripComments(source) {
  let result = '';
  let lastCommentEnd = 0;

  rangesOfComments(source).forEach(range => {
    result += source.slice(lastCommentEnd, range[0]);
    lastCommentEnd = range[1];
  });

  result += source.slice(lastCommentEnd);

  return result;
}

/**
 * @param {string} source
 * @returns {number[][]}
 */
function rangesOfComments(source) {
  var result = [];
  var index = 0;
  var lastLineStart = 0;
  var end = source.length;
  var state = 0;

  var rangeStart = 0;
  var rangeEnd = 0;

  while (index < end) {
    var c = source.charCodeAt(index);

    switch (state) {
      case NORMAL:
        if (c === HASH_CODE) {
          rangeStart = index;
          if (index === lastLineStart) {
            if (source.slice(index, index + 4) === '###\n') {
              state = BLOCK_COMMENT;
              index += 3;
            } else {
              state = LINE_COMMENT;
            }
          } else {
            state = LINE_COMMENT;
          }
        }
        break;

      case LINE_COMMENT:
        if (c === NEWLINE_CODE) {
          rangeEnd = index;
          result.push([rangeStart, rangeEnd]);
          state = NORMAL;
        }
        break;

      case BLOCK_COMMENT:
        if (c === HASH_CODE) {
          if (index === lastLineStart) {
            if (source.slice(index, index + 4) === '###\n') {
              index += 3;
              state = NORMAL;
            } else if (source.slice(index, index + 4) === '###' /* EOF */) {
              index += 3;
              state = NORMAL;
            }
            rangeEnd = index;
            result.push([rangeStart, rangeEnd]);
          }
        }
        break;
    }

    if (source.charCodeAt(index) === NEWLINE_CODE) {
      lastLineStart = index + 1;
    }
    index++;
  }

  return result;
}
