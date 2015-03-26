/**
 * Removes the backticks surrounding embedded JavaScript.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchEmbeddedJavaScript(node, patcher) {
  if (node.type === 'JavaScript') {
    patcher.replace(node.range[0], node.range[0] + 1, '');
    patcher.replace(node.range[1] - 1, node.range[1], '');
  }
}
