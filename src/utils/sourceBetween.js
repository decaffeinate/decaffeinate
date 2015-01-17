/**
 * Get the source between the two given nodes.
 *
 * @param {string} source
 * @param {Object} left
 * @param {Object} right
 */
export default function sourceBetween(source, left, right) {
  return source.slice(left.range[1], right.range[0]);
}
