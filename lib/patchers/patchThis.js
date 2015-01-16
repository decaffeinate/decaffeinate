/**
 * Replaces shorthand `this` (i.e. `@`) with longhand `this`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
function patchThis(node, patcher) {
  if (node.type === 'This' && node.raw === '@') {
    patcher.replace(node.range[0], node.range[1], 'this');
  } else if (node.type === 'MemberAccessOp' && node.raw[0] === '@' && node.expression.type === 'This' && node.raw[1] !== '.') {
    patcher.insert(node.range[0] + 1, '.');
  }
}
exports.patchThis = patchThis;
