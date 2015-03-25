import getIndent from '../utils/getIndent';
import isImplicitlyReturned from '../utils/isImplicitlyReturned';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import leftHandIdentifiers from '../utils/leftHandIdentifiers';

/**
 * Adds declarations for variable assignments.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchDeclarations(node, patcher) {
  if (node.type === 'AssignOp' && !isExpressionAssignment(node)) {
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
  } else if (node.type === 'Block') {
    const names = [];
    node.scope.getOwnNames().forEach(name => {
      const binding = node.scope.getBinding(name);
      const assignment = findAssignmentForBinding(binding);
      if (isExpressionAssignment(assignment)) {
        names.push(name);
      }
    });
    if (names.length > 0) {
      const firstStatementStart = node.statements[0].range[0];
      const indent = getIndent(patcher.original, firstStatementStart);
      const declarations = names.map(name => `var ${name};\n${indent}`).join('');
      patcher.insert(firstStatementStart, declarations);
    }
  }
}

/**
 * Determines whether a node is an assignment in an expression context.
 *
 * @param {Object?} node
 * @returns {boolean}
 */
function isExpressionAssignment(node) {
  if (!node || node.type !== 'AssignOp') {
    return false;
  }

  return isExpressionResultUsed(node);
}

/**
 * Finds the AssignOp node associated with a binding identifier.
 *
 * @param {Object} binding Identifier
 * @returns {Object} AssignOp
 */
function findAssignmentForBinding(binding) {
  let assignment = binding;

  while (assignment && assignment.type !== 'AssignOp') {
    assignment = assignment.parent;
  }

  return assignment;
}
