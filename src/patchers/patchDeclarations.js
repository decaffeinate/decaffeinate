import leftHandIdentifiers from '../utils/leftHandIdentifiers';

/**
 * Adds declarations for variable assignments.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchDeclarations(node, patcher) {
  if (node.type === 'AssignOp') {
    const identifiers = leftHandIdentifiers(node.assignee);
    const requiresDeclaration = identifiers.some(
      identifier => node.scope.getBinding(identifier.data) === identifier
    );

    if (requiresDeclaration) {
      patcher.insert(node.range[0], 'var ');
    } else if (node.assignee.type === 'ObjectInitialiser') {
      // Object destructuring not part of a variable declaration needs parens.
      patcher.insert(node.assignee.range[0], '(').insert(node.assignee.range[1], ')');
    }
  }
}
