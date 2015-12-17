import lex, { NORMAL, COMMENT, HERECOMMENT, EOF } from './lex';

/**
 * Returns the ranges of the sections of source code that are not comments.
 *
 * @param {string} source
 * @returns {Array.<{start: number, end: number, type: string}>}
 */
export default function rangesOfComments(source) {
  const result = [];
  const step = lex(source);
  let index;
  let state;
  let previousState;
  let commentStartIndex;
  let type;

  while (state !== EOF) {
    ({ index, state, previousState } = step());

    switch (previousState) {
      case NORMAL:
        if (state === COMMENT) {
          commentStartIndex = index - '#'.length;
          if (commentStartIndex === 0 && source[index] === '!') {
            type = 'shebang';
          } else {
            type = 'line';
          }
        } else if (state === HERECOMMENT) {
          commentStartIndex = index - '###'.length;
          type = 'block';
        }
        break;

      case COMMENT:
      case HERECOMMENT:
        if (state === NORMAL || state === EOF) {
          result.push({
            start: commentStartIndex,
            end: index,
            type
          });
        }
        break;
    }
  }

  return result;
}
