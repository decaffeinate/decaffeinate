const sourceOffsetForLineAndColumn = require('../source').sourceOffsetForLineAndColumn;

/**
 * Returns insertions necessary to ensure the given list has no optional commas.
 *
 * @param {string} source
 * @param {Array} list
 * @returns {Insertion[]}
 */
function getCommaInsertionsForList(source, list) {
  const length = source.length;
  const insertions = [];
  list.forEach(function(obj, i) {
    if (i + 1 === list.length) { return; }

    const objectEndOffset = sourceOffsetForLineAndColumn(
      source,
      obj.locationData.last_line,
      obj.locationData.last_column
    );

    var offset = objectEndOffset;
    var expectedCommaIndex;

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

    if (expectedCommaIndex) {
      insertions.push({
        index: expectedCommaIndex,
        value: ','
      });
    }
  });
  return insertions;
}
exports.getCommaInsertionsForList = getCommaInsertionsForList;
