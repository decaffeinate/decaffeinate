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
    case 'Conditional':
    case 'Try':
      return false;
  }

  // Look for one-expression function return values, e.g. `-> 1`.
  if (node.parent.type === 'Function' || node.parent.type === 'BoundFunction') {
    if (node.parent.body === node) {
      return true;
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
    // ancestor.parent is a Block
    switch (ancestor.parent.parent.type) {
      case 'Function':
      case 'BoundFunction':
        return true;

      case 'Conditional':
        ancestor = ancestor.parent.parent;
        if (ancestor.parent.type === 'Conditional' && ancestor.parent.alternate === ancestor) {
          ancestor = ancestor.parent;
        }
        break;

      case 'Try':
        ancestor = ancestor.parent.parent;
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
  if (node.parent && node.parent.type !== 'Block') {
    return false;
  }

  let statements = node.parent.statements;
  let index = statements.indexOf(node);

  if (index < 0) {
    return false;
  }

  return index === statements.length - 1;
}
