/**
 * Determines whether the given node spans multiple lines.
 *
 * @param {string} source
 * @param {Object} node
 * @returns {boolean}
 */
export default function isMultiline(source, node) {
  let newlineIndex = source.indexOf('\n', node.range[0]);
  return newlineIndex >= 0 && newlineIndex < node.range[1];
}
