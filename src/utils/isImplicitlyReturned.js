/**
 * Determines whether the given node is implicitly returned.
 *
 * @param node
 * @returns {boolean}
 */
export default function isImplicitlyReturned(node) {
  if (!node.parentNode) {
    return false;
  }

  switch (node.type) {
    case 'Return':
    case 'Block':
    case 'Conditional':
    case 'Try':
      return false;
  }

  // Look for one-expression function return values, e.g. `-> 1`.
  if (node.parentNode.type === 'Function' || node.parentNode.type === 'BoundFunction') {
    if (node.parentNode.body === node) {
      return node.parentNode.parentNode.type !== 'Constructor';
    }
  }


  // Look for block functions with implicit returns, e.g.
  //
  //   ->
  //     a
  //     b  # implicitly returned
  //
  let ancestor = node;

  while (isLastStatement(ancestor)) {
    // ancestor.parentNode is a Block
    switch (ancestor.parentNode.parentNode.type) {
      case 'Function':
        return ancestor.parentNode.parentNode.parentNode.type !== 'Constructor';

      case 'BoundFunction':
        return true;

      case 'Conditional':
        ancestor = ancestor.parentNode.parentNode;
        if (ancestor.parentNode.type === 'Conditional' && ancestor.parentNode.alternate === ancestor) {
          ancestor = ancestor.parentNode;
        }
        break;

      case 'Try':
        ancestor = ancestor.parentNode.parentNode;
        break;

      default:
        return false;
    }
  }

  return false;
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function isLastStatement(node) {
  if (node.parentNode && node.parentNode.type !== 'Block') {
    return false;
  }

  let statements = node.parentNode.statements;
  let index = statements.indexOf(node);

  if (index < 0) {
    return false;
  }

  return index === statements.length - 1;
}
