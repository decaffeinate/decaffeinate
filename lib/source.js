const tokens = require('coffee-script').tokens;

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
 * Determines whether the given CoffeeScript node is on multiple lines.
 *
 * @param {*} csNode
 */
function isMultilineCSNode(csNode) {
  return csNode.locationData.first_line !== csNode.locationData.last_line;
}
exports.isMultilineCSNode = isMultilineCSNode;

/**
 * Gets the source code between two CoffeeScript nodes.
 *
 * @param {string} source
 * @param {*} csNodeLeft
 * @param {*} csNodeRight
 * @returns {string}
 */
function sourceBetweenCSNodes(source, csNodeLeft, csNodeRight) {
  const start = sourceOffsetForLineAndColumn(
    source,
    csNodeLeft.locationData.last_line,
    csNodeLeft.locationData.last_column
  ) + 1;

  const end = sourceOffsetForLineAndColumn(
    source,
    csNodeRight.locationData.first_line,
    csNodeRight.locationData.first_column
  );

  return source.slice(start, end);
}
exports.sourceBetweenCSNodes = sourceBetweenCSNodes;

/**
 * @param {string} source
 * @param {*} csNode
 * @returns {number}
 */
function sourceOffsetForCSNodeStart(source, csNode) {
  return sourceOffsetForLineAndColumn(
    source,
    csNode.locationData.first_line,
    csNode.locationData.first_column
  );
}
exports.sourceOffsetForCSNodeStart = sourceOffsetForCSNodeStart;

/**
 * @param {string} source
 * @param {*} csNode
 * @returns {number}
 */
function sourceOffsetForCSNodeEnd(source, csNode) {
  return sourceOffsetForLineAndColumn(
      source,
      csNode.locationData.last_line,
      csNode.locationData.last_column
    ) + 1;
}
exports.sourceOffsetForCSNodeEnd = sourceOffsetForCSNodeEnd;

/**
 * @param {string} source
 * @param {number} offset
 * @returns {string}
 */
function indentationAtOffset(source, offset) {
  const previousNewline = source.lastIndexOf('\n', offset);

  var endOfIndent = previousNewline + 1;
  while (source[endOfIndent] === ' ' || source[endOfIndent] === '\t') {
    endOfIndent++
  }

  return source.slice(previousNewline + 1, endOfIndent);
}
exports.indentationAtOffset = indentationAtOffset;

/**
 * @param {string} source
 * @param {number} offset
 * @returns {number}
 */
function lastIndexOfSignificantCharacterInRange(source, start, end) {
  const slice = source.slice(start, end);
  const tt = tokens(slice, { rewrite: false });

  for (var i = tt.length - 1; i >= 0; i--) {
    var token = tt[i];
    switch (token[0]) {
      case 'TERMINATOR':
      case 'OUTDENT':
      case 'INDENT':
        break;

      default:
        return start + sourceOffsetForLineAndColumn(
          slice,
          token[2].last_line,
          token[2].last_column
        );
    }
  }
}
exports.lastIndexOfSignificantCharacterInRange = lastIndexOfSignificantCharacterInRange;

/**
 * @param {string} source
 * @param {*} node
 * @param {string} left
 * @param {string} right
 */
function isWrappedInside(source, node, left, right) {
  const start = sourceOffsetForCSNodeStart(source, node);
  var beforeStartOffset = start - 1;
  var hasReachedLeftWrappingCharacter = false;

  while (!hasReachedLeftWrappingCharacter) {
    switch (source[beforeStartOffset]) {
      case '\n':
      case ' ':
      case '\t':
        beforeStartOffset--;
        break;

      default:
        hasReachedLeftWrappingCharacter = true;
        break;
    }
  }

  if (source[beforeStartOffset] !== left) {
    return false;
  }

  var afterEndOffset = sourceOffsetForCSNodeEnd(source, node);
  var hasReachedRightWrappingCharacter = false;

  while (!hasReachedRightWrappingCharacter) {
    switch (source[afterEndOffset]) {
      case '\n':
      case ' ':
      case '\t':
        afterEndOffset++;
        break;

      default:
        hasReachedRightWrappingCharacter = true;
        break;
    }
  }

  return source[afterEndOffset] === right;
}
exports.isWrappedInside = isWrappedInside;

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
