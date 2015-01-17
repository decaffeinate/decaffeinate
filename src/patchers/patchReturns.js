/**
 * Inserts return keywords
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchReturns(node, patcher) {
  if (node.type === 'Function') {
    const body = node.body;
    if (body.type === 'Block') {
      patchLastStatement(body.statements[body.statements.length - 1], patcher);
    } else {
      patchLastStatement(body, patcher);
    }
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
function patchLastStatement(node, patcher) {
  if (node.type !== 'Return') {
    patcher.insert(node.range[0], 'return ');
  }
}
