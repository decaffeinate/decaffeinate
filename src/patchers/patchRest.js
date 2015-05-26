/**
 * Patches rest parameters.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchRestStart(node, patcher) {
  if (node.type === 'Rest') {
    patcher.insert(node.range[0], '...');
  }
}

/**
 * Patches rest parameters.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchRestEnd(node, patcher) {
  if (node.type === 'Rest') {
    patcher.replace(node.range[1] - '...'.length, node.range[1], '');
  }
}
