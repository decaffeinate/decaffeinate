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
  const result = findTokensForRangeIgnoringInvalidTrailingCharacters(source, start, end);
  const tokens = result.tokens;

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token = tokens[i];
    switch (token[0]) {
      case 'TERMINATOR':
      case 'OUTDENT':
      case 'INDENT':
        break;

      default:
        return start + sourceOffsetForLineAndColumn(
          source.slice(result.start, result.end),
          token[2].last_line,
          token[2].last_column
        );
    }
  }
}
exports.lastIndexOfSignificantCharacterInRange = lastIndexOfSignificantCharacterInRange;

/**
 * This is here to work around an issue with the CoffeeScript parser returning
 * incorrect location data for nodes, often including trailing characters that
 * do not actually belong to the node.
 *
 * @param {string} source
 * @param {number} start
 * @param {number} end
 * @returns {{tokens: *[][], start: number, end: number}}
 */
function findTokensForRangeIgnoringInvalidTrailingCharacters(source, start, end) {
  var candidateEnd = end;
  var error;

  while (start <= candidateEnd) {
    var slice = source.slice(start, candidateEnd);
    try {
      return {
        tokens: tokens(slice, { rewrite: false }),
        start: start,
        end: candidateEnd
      };
    } catch (ex) {
      if (!error) {
        error = ex;
      }
      candidateEnd--;
    }
  }

  throw error;
}

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
  var result = findTokensForRangeIgnoringInvalidTrailingCharacters(source, start, afterEndOffset);

  return source[result.end] === right;
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

/**
 * @param {string} source
 * @returns {string}
 */
function fixClosingParenthesesOrder(source) {
  const result = [];
  const initialClosingParenCountByLine = {};
  const initialClosingParenPattern = /^([ \t]*)\) *$/;

  source.split('\n').forEach(function(line, i) {
    result[i] = line;

    const initialClosingParenMatch = line.match(initialClosingParenPattern);

    if (!initialClosingParenMatch) {
      return;
    }

    const initialClosingParenCount = initialClosingParenMatch[1].length;
    initialClosingParenCountByLine[i] = initialClosingParenCount;
    const previousInitialClosingParenCount = initialClosingParenCountByLine[i - 1];

    if (typeof previousInitialClosingParenCount !== 'number') {
      return;
    }

    if (previousInitialClosingParenCount < initialClosingParenCount) {
      result[i] = result[i - 1];
      result[i - 1] = line;
    }
  });

  return result.join('\n');
}
exports.fixClosingParenthesesOrder = fixClosingParenthesesOrder;
