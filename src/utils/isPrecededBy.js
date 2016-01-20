/**
 * Determines whether a node is preceded by a particular token.
 *
 * @param {Object} node
 * @param {string} source
 * @param {string} token
 * @param {Array<string>} ignore
 * @returns {boolean}
 */
export default function isPrecededBy(node, source, token, ignore=[' ', '\n', '\t']) {
  let index = node.range[0] - token.length;

  while (index >= 0) {
    if (source.slice(index, index + token.length) === token) {
      return true;
    } else if (ignore.indexOf(source[index + token.length - 1]) >= 0) {
      index--;
    } else {
      break;
    }
  }

  return false;
}
