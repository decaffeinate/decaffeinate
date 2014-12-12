/**
 * Gets the source code for the given CoffeeScript node.
 *
 * @param {string} source
 * @param {*} csNode
 * @returns {string}
 */
function sourceForCSNode(source, csNode) {
  const loc = csNode.locationData;
  const start = sourceOffsetForLineAndColumn(source, loc.first_line, loc.first_column);
  const end = sourceOffsetForLineAndColumn(source, loc.last_line, loc.last_column) + 1;
  return source.slice(start, end);
}
exports.sourceForCSNode = sourceForCSNode;

/**
 * Gets the source code for the given JavaScript node.
 *
 * @param {string} source
 * @param {*} jsNode
 * @returns {string}
 */
function sourceForJSNode(source, jsNode) {
  const start = sourceOffsetForLineAndColumn(
    source,
    jsNode.loc.start.line - 1,
    jsNode.loc.start.column
  );
  const end = sourceOffsetForLineAndColumn(
    source,
    jsNode.loc.end.line - 1,
    jsNode.loc.end.column
  );
  return source.slice(start, end);
}
exports.sourceForJSNode = sourceForJSNode;

/**
 * Gets the absolute character offset for the given line/column in source.
 *
 * @param {string} source
 * @param {number} line
 * @param {number} column
 * @returns {number}
 */
function sourceOffsetForLineAndColumn(source, line, column) {
  var offset = 0;
  while (line > 0) {
    offset = source.indexOf('\n', offset) + 1;
    line--;
  }
  return offset + column;
}
exports.sourceOffsetForLineAndColumn = sourceOffsetForLineAndColumn;
