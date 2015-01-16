const NORMAL = 0;
const LINE_COMMENT = 1;
const BLOCK_COMMENT = 5;
const NEWLINE_CODE = 10;
const HASH_CODE = 35;

function stripComments(source) {
  var result = '';
  var index = 0;
  var lastLineStart = 0;
  var end = source.length;
  var state = 0;

  while (index < end) {
    var c = source.charCodeAt(index);

    switch (state) {
      case NORMAL:
        if (c === HASH_CODE) {
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
        } else {
          result += source[index];
        }
        break;

      case LINE_COMMENT:
        if (c === NEWLINE_CODE) {
          state = NORMAL;
          result += '\n';
        }
        break;

      case BLOCK_COMMENT:
        if (c === HASH_CODE) {
          if (index === lastLineStart) {
            if (source.slice(index, index + 4) === '###\n') {
              index += 3;
              state = NORMAL;
              result += '\n';
            } else if (source.slice(index, index + 4) === '###' /* EOF */) {
              index += 3;
              state = NORMAL;
            }
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
exports.stripComments = stripComments;