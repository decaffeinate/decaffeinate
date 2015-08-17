/**
 * Determine whether CoffeeScript would consider repeating the given node to be
 * safe. The reality is that CoffeeScript is a little more cavalier than I would
 * be since even a reference to an unbound variable can have side effects. This
 * reflects what CoffeeScript does so as to maintain behavioral compatibility.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export default function isSafeToRepeat(node) {
  switch (node.type) {
    case 'Identifier':
    case 'Int':
    case 'Float':
      return true;

    case 'MemberAccessOp':
      return isSafeToRepeat(node.expression);

    case 'DynamicMemberAccessOp':
      return isSafeToRepeat(node.expression) && isSafeToRepeat(node.indexingExpr);

    default:
      return false;
  }
}
