import lex, { COMMENT, HERECOMMENT }  from 'coffee-lex';

/**
 * Scans `source` for comments and returns information about them.
 *
 * @param {string} source
 * @returns {Array.<{start: number, end: number, type: string}>}
 */
export default function rangesOfComments(source) {
  return lex(source)
    .filter(token => token.type === COMMENT || token.type === HERECOMMENT)
    .map(comment => {
      let type;
      if (comment.type === COMMENT) {
        if (comment.start === 0 && source[1] === '!') {
          type = 'shebang';
        } else {
          type = 'line';
        }
      } else if (comment.type === HERECOMMENT) {
        type = 'block';
      }
      return {
        start: comment.start,
        end: comment.end,
        type
      };
    });
}
