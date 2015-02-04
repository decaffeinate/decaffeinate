/**
 * Determines whether a node is preceded by a particular token.
 *
 * @param {Object} node
 * @param {string} source
 * @param {string} token
 * @returns {boolean}
 */
export default function isPrecededBy(node, source, token) {
  var index = node.range[1] - token.length;

  while (index >= 0) {
    if (source.slice(index, index + token.length) === token) {
      return true;
    } else if (source[index] === ' ' || source[index] === '\n' || source[index] === '\t') {
      index--;
    } else {
      break;
    }
  }

  return false;
}
