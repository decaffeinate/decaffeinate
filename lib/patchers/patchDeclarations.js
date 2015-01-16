/**
 * Adds declarations for variable assignments.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
function patchDeclarations(node, patcher) {
  if (node.type === 'AssignOp') {
    if (node.assignee.type === 'Identifier') {
      if (node._scope.getBinding(node.assignee.data) === node.assignee) {
        patcher.insert(node.range[0], 'var ');
      }
    }
  }
}
exports.patchDeclarations = patchDeclarations;