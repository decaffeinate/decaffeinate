/**
 * Determines whether a node is followed by a particular token.
 *
 * @param {Object} node
 * @param {string} source
 * @param {string} token
 * @returns {boolean}
 */
export default function isFollowedBy(node, source, token) {
  let index = node.range[1];

  while (index < source.length) {
    if (source.slice(index, index + token.length) === token) {
      return true;
    } else if (source[index] === ' ' || source[index] === '\n' || source[index] === '\t') {
      index++;
    } else {
      break;
    }
  }

  return false;
}
