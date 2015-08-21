import isParameter from '../utils/isParameter';

/**
 * Replaces shorthand `this` (i.e. `@`) with longhand `this`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchThis(node, patcher) {
  if (isParameter(node) || isParameter(node.parentNode)) {
    // Don't process e.g. `@b` in `(a, @b) ->`.
    return;
  }

  if (node.type === 'This' && node.raw === '@') {
    patcher.overwrite(node.range[0], node.range[1], 'this');
  } else if (node.type === 'MemberAccessOp' && node.raw[0] === '@' && node.expression.type === 'This' && node.raw[1] !== '.') {
    patcher.insert(node.range[0] + 1, '.');
  }
}
