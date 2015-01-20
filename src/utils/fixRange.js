/**
 * Fixes the range information for a node.
 *
 * @param {Object} node
 * @param {string} source Code parsed into an AST which `node` comes from.
 */
export default function fixRange(node, source) {
  var index = -1;
  var expectedStart = node.range[0];
  var minimumOffsetIndex = -1;
  var minimumOffset = Infinity;

  while ((index = source.indexOf(node.raw, index + 1)) >= 0) {
    if (minimumOffsetIndex < 0) {
      minimumOffsetIndex = index;
      minimumOffset = Math.abs(expectedStart - minimumOffsetIndex);
    } else {
      var thisOffset = Math.abs(expectedStart - index);
      if (thisOffset < minimumOffset) {
        minimumOffset = thisOffset;
        minimumOffsetIndex = index;
      }
    }
  }

  if (minimumOffsetIndex < 0) {
    throw new Error('unable to find location for node: ' + JSON.stringify(node.raw));
  }

  node.range[0] = minimumOffsetIndex;
  node.range[1] = minimumOffsetIndex + node.raw.length;

  return minimumOffsetIndex - expectedStart;
}
