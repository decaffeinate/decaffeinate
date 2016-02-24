import rangesOfComments from './rangesOfComments.js';

/**
 * @param {string} source
 * @returns {string}
 */
export default function stripComments(source) {
  let result = '';
  let lastCommentEnd = 0;

  rangesOfComments(source).forEach(({start, end}) => {
    result += source.slice(lastCommentEnd, start);
    lastCommentEnd = end;
  });

  result += source.slice(lastCommentEnd);

  return result;
}
