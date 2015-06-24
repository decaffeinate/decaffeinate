/**
 * Replaces block regexes with single-line regexes.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchRegularExpressions(node, patcher) {
  if (node.type === 'RegExp') {
    patcher.replace(node.range[0], node.range[1], `/${node.data}/`);
  }
}