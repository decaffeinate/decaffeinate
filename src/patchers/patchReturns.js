import isImplicitlyReturned from '../utils/isImplicitlyReturned';

/**
 * Inserts return keywords
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchReturns(node, patcher) {
  if (isImplicitlyReturned(node)) {
    if (node.parent.type === 'Block' || node.parent.type === 'Function') {
      patcher.insert(node.range[0], 'return ');
    }
  }
}
