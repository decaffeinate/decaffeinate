const source = require('../source');
const sourceOffsetForCSNodeStart = source.sourceOffsetForCSNodeStart;
const sourceOffsetForCSNodeEnd = source.sourceOffsetForCSNodeEnd;
const lastIndexOfSignificantCharacterInRange = source.lastIndexOfSignificantCharacterInRange;
const isMultilineCSNode = source.isMultilineCSNode;
const indentationAtOffset = source.indentationAtOffset;
const isWrappedInside = source.isWrappedInside;

/**
 * Returns splices necessary to wrap all multi-line functions in parentheses.
 *
 * @param {string} source
 * @param {*} fn
 * @returns {Diff[]}
 */
function getParenthesesDiffsForFunction(source, fn) {
  if (!isMultilineCSNode(fn) || isWrappedInside(source, fn, '(', ')')) {
    return [];
  }

  const fnStart = sourceOffsetForCSNodeStart(source, fn);
  const fnEnd = sourceOffsetForCSNodeEnd(source, fn);
  const indent = indentationAtOffset(source, fnStart);
  const realFnEnd = lastIndexOfSignificantCharacterInRange(source, fnStart, fnEnd);

  return [
    [0, source.slice(0, fnStart)],
    [1, '('],
    [0, source.slice(fnStart, realFnEnd + 1)],
    [1, '\n' + indent + ')'],
    [0, source.slice(realFnEnd + 1)]
  ];
}
exports.getParenthesesDiffsForFunction = getParenthesesDiffsForFunction;
