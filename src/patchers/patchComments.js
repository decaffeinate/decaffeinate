import getIndent from '../utils/getIndent';
import rangesOfComments from '../utils/rangesOfComments';

/**
 * Replaces CoffeeScript style comments with JavaScript style comments.
 *
 * @param {MagicString} patcher
 */
export default function patchComments(patcher) {
  const source = patcher.original;
  const ranges = rangesOfComments(source);

  ranges.forEach(comment => {
    switch (comment.type) {
      case 'line':
        patchLineComment(patcher, comment);
        break;

      case 'block':
        patchBlockComment(patcher, comment);
        break;

      case 'shebang':
        patchShebangComment(patcher, comment);
        break;
    }
  });
}

/**
 * Patches a single-line comment.
 *
 * @param {MagicString} patcher
 * @param {{start: number, end: number, type: string}} range
 * @private
 */
function patchLineComment(patcher, range) {
  patcher.overwrite(range.start, range.start + '#'.length, '//');
}

const BLOCK_COMMENT_DELIMITER = '###';

/**
 * Patches a block comment.
 *
 * @param {MagicString} patcher
 * @param {{start: number, end: number, type: string}} range
 * @private
 */
function patchBlockComment(patcher, range) {
  const { start, end } = range;

  patcher.overwrite(start, start + BLOCK_COMMENT_DELIMITER.length, '/*');

  let atStartOfLine = false;
  let lastStartOfLine = null;
  let lineUpAsterisks = true;
  let isMultiline = false;
  const source = patcher.original;
  const expectedIndent = getIndent(source, start);
  const leadingHashIndexes = [];

  for (let index = start + BLOCK_COMMENT_DELIMITER.length; index < end - BLOCK_COMMENT_DELIMITER.length; index++) {
    switch (source[index]) {
      case '\n':
        isMultiline = true;
        atStartOfLine = true;
        lastStartOfLine = index + '\n'.length;
        break;

      case ' ':
      case '\t':
        break;

      case '#':
        if (atStartOfLine) {
          leadingHashIndexes.push(index);
          atStartOfLine = false;
          if (source.slice(lastStartOfLine, index) !== expectedIndent) {
            lineUpAsterisks = false;
          }
        }
        break;

      default:
        if (atStartOfLine) {
          atStartOfLine = false;
          lineUpAsterisks = false;
        }
        break;
    }
  }

  leadingHashIndexes.forEach(index => {
    patcher.overwrite(index, index + '#'.length, lineUpAsterisks ? ' *' : '*');
  });

  patcher.overwrite(end - BLOCK_COMMENT_DELIMITER.length, end, isMultiline && lineUpAsterisks ? ' */' : '*/');
}

/**
 * Patches a shebang comment.
 *
 * @param {MagicString} patcher
 * @param {{start: number, end: number, type: string}} range
 * @private
 */
function patchShebangComment(patcher, range) {
  const { start, end } = range;
  const commentBody = patcher.slice(start, end);
  const coffeeIndex = commentBody.indexOf('coffee');

  if (coffeeIndex >= 0) {
    patcher.overwrite(
      start + coffeeIndex,
      start + coffeeIndex + 'coffee'.length,
      'node'
    );
  }
}
