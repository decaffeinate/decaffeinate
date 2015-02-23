/**
 * Determines whether the given node is implicitly returned.
 *
 * @param node
 * @returns {boolean}
 */
export default function isImplicitlyReturned(node) {
  if (!node.parent) {
    return false;
  }

  switch (node.type) {
    case 'Return':
    case 'Block':
      return false;
  }

  switch (node.parent.type) {
    case 'Block':
      let grandparent = node.parent.parent;

      if (grandparent.type !== 'Function' && grandparent.type !== 'BoundFunction') {
        return false;
      }

      let statements = node.parent.statements;
      let index = statements.indexOf(node);

      if (index < 0) {
        return false;
      }

      return index === statements.length - 1;

    case 'Function':
    case 'BoundFunction':
      return node.parent.body === node;

    default:
      return false;
  }
}
