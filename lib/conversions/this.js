const source = require('../source');
const sourceForCSNode = source.sourceForCSNode;
const sourceOffsetForCSNodeStart = source.sourceOffsetForCSNodeStart;
const sourceOffsetForCSNodeEnd = source.sourceOffsetForCSNodeEnd;

/**
 * @param {string} source
 * @param {*} value
 * @returns {Diff[]}
 */
function getThisDiffForValue(source, value) {
  const thisSource = sourceForCSNode(source, value.base);

  if (thisSource !== '@') {
    return [];
  }

  const thisStart = sourceOffsetForCSNodeStart(source, value.base);
  const thisEnd = sourceOffsetForCSNodeEnd(source, value.base);
  const isMemberExpression = value.properties && (value.properties.length > 0);

  return [
    [0, source.slice(0, thisStart)],
    [-1, thisSource],
    [1, isMemberExpression ? 'this.' : 'this'],
    [0, source.slice(thisEnd)]
  ];
}
exports.getThisDiffForValue = getThisDiffForValue;
