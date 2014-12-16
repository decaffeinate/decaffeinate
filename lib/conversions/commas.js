const sourceOffsetForLineAndColumn = require('../source').sourceOffsetForLineAndColumn;
const sourceForCSNode = require('../source').sourceForCSNode;
const isComment = require('../types').isComment;

/**
 * Returns diffs necessary to ensure the given list has no optional commas.
 *
 * @param {string} source
 * @param {Array} list
 * @returns {Diff[]}
 */
function getCommaDiffsForList(source, list) {
  const diffs = [];
  var offset = 0;

  const listWithoutComments = list.filter(function(node) {
    return !isComment(node);
  });

  listWithoutComments.forEach(function(obj, i) {
    if (i + 1 === listWithoutComments.length) { return; }

    const loc = obj.locationData;
    const objectEndOffset = sourceOffsetForLineAndColumn(
      source,
      loc.last_line,
      loc.last_column
    );

    if (source[objectEndOffset + 1] === ',') {
      return;
    }

    var expectedCommaIndex;

    const objectSource = sourceForCSNode(source, obj);
    const trailingWhitespaceMatch = objectSource.match(/([ \t]*\n)\s*?([ \t]*)$/);

    if (trailingWhitespaceMatch) {
      const allTrailingWhitespace = trailingWhitespaceMatch[0];
      const sameLineTrailingWhitespace = trailingWhitespaceMatch[1];
      const indentWhitespace = trailingWhitespaceMatch[2];

      expectedCommaIndex = objectEndOffset - (
        // All whitespace at end except for anything before the first newline.
        allTrailingWhitespace.length - sameLineTrailingWhitespace.length
      );

      if (offset !== expectedCommaIndex) {
        diffs.push([0, source.slice(offset, expectedCommaIndex)]);
      }
      diffs.push([1, '\n' + indentWhitespace + ',']);
      offset = expectedCommaIndex;
    } else {
      expectedCommaIndex = indexForCommaAfterObjectEnd(source, objectEndOffset);

      if (expectedCommaIndex) {
        if (offset !== expectedCommaIndex) {
          diffs.push([0, source.slice(offset, expectedCommaIndex)]);
        }
        diffs.push([1, ',']);
        offset = expectedCommaIndex;
      }
    }
  });

  // Add the end.
  diffs.push([0, source.slice(offset)]);

  return diffs;
}
exports.getCommaDiffsForList = getCommaDiffsForList;

/**
 * @param {string} source
 * @param {number} objectEndOffset
 * @returns {?number}
 */
function indexForCommaAfterObjectEnd(source, objectEndOffset) {
  const length = source.length;
  var offset = objectEndOffset;
  var expectedCommaIndex = null;

  for (var done = false; !done && offset < length; offset++) {
    switch (source[offset]) {
      case '\n':
        // e.g. `1\n`, insert ',' before '\n'
        expectedCommaIndex = offset;
        done = true;
        break;

      case ',':
        // e.g. `1,`, no need for a comma
        done = true;
        break;

      case '#':
        // e.g. `1 # hi`, insert ',' after '1'
        expectedCommaIndex = objectEndOffset + 1;
        done = true;
        break;
    }
  }

  return expectedCommaIndex;
}
