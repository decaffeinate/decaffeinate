/**
 * Patches spread arguments.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchSpreadStart(node, patcher) {
  if (node.type === 'Spread') {
    patcher.insert(node.range[0], '...');
  }
}

/**
 * Patches spread arguments.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchSpreadEnd(node, patcher) {
  if (node.type === 'Spread') {
    patcher.replace(node.range[1] - '...'.length, node.range[1], '');
  }
}
