import isImplicitlyReturned from '../utils/isImplicitlyReturned';

/**
 * Inserts return keywords
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchReturns(node, patcher) {
  if (isImplicitlyReturned(node)) {
    patcher.insert(node.range[0], 'return ');
  }
}
