/**
 * Determines whether the given node prefers to be a statement.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export default function wantsToBeStatement(node) {
  if (!node) {
    return false;
  }

  switch (node.type) {
    case 'Throw':
      return true;

    case 'Conditional':
      return wantsToBeStatement(node.consequent) || wantsToBeStatement(node.alternate);

    default:
      return false;
  }
}
