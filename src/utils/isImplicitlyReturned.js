import traverse from './traverse';
import { isFunction } from './types';

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
    case 'Throw':
    case 'Switch':
      return false;

    case 'ForIn':
    case 'ForOf':
    case 'While':
      return couldContainImplicitReturn(node) && !explicitlyReturns(node);

    default:
      return couldContainImplicitReturn(node);
  }
}

/**
 * Determines whether the given node could contain an implicit return.
 *
 * @param {Object} node
 * @returns {boolean}
 * @private
 */
function couldContainImplicitReturn(node) {
  const { parentNode } = node;

  if (!parentNode) {
    /*
     * Program is only one without a parent, and is not in return position.
     */
    return false;
  }

  if (parentNode.type === 'Function' && node === parentNode.body) {
    /*
     * Function body is nearly always in return position, whether it's a block:
     *
     *   ->
     *     implicitlyReturned
     *
     * or not:
     *
     *   -> implicitlyReturned
     *
     * The one exception is class constructors, which should not have implicit
     * returns:
     *
     *   class Foo
     *     constructor: ->
     *       notImplicitlyReturned
     */
    return parentNode.parentNode.type !== 'Constructor';
  }

  if (parentNode.type === 'BoundFunction' && node.type === 'Block') {
    /*
     * Blocks in bound functions are in a return position:
     *
     *   =>
     *     implicitlyReturned
     *
     * Note that if the body of a bound function is not a block then we do not
     * consider it in a return position because no "return" statements need
     * to be created:
     *
     *   => notImplicitlyReturned
     */
    return true;
  }

  if (parentNode.type === 'Block') {
    /*
     * Block statements are implicitly returned only if they are the last
     * statement:
     *
     *   neverImplicitlyReturned
     *   mightBeImplicitlyReturned
     *
     * In addition, the block itself must be in a position is part of the
     * implicit return chain, such as a function body:
     *
     *   ->
     *     notImplicitlyReturned
     *     implicitlyReturned
     */
    return isLastStatement(node) && couldContainImplicitReturn(parentNode);
  }

  if (parentNode.type === 'Conditional' && node !== parentNode.condition) {
    /*
     * A consequent or alternate is in return position iff its parent
     * conditional is:
     *
     *   if notImplicitlyReturned
     *     mightBeImplicitlyReturned
     *   else
     *     mightBeImplicitlyReturned
     */
    return couldContainImplicitReturn(parentNode);
  }

  if (parentNode.type === 'Try' && node !== parentNode.catchAssignee) {
    /*
     * All of the try/catch/finally blocks under a `try` are in return position
     * iff the `try` itself is:
     *
     *   try
     *     mightBeImplicitlyReturned
     *   catch notImplicitlyReturned
     *     mightBeImplicitlyReturned
     *   finally
     *     mightBeImplicitlyReturned
     */
    return couldContainImplicitReturn(parentNode);
  }

  if (parentNode.type === 'SwitchCase' && node === parentNode.consequent) {
    /*
     * Consequents for a `switch` case are in return position iff the `switch`
     * itself is:
     *
     *   switch notImplicitlyReturned
     *     when notImplicitlyReturned then mightBeImplicitlyReturned
     *     when notImplicitlyReturned
     *       mightBeImplicitlyReturned
     */
    return couldContainImplicitReturn(/* Switch */parentNode.parentNode);
  }

  if (parentNode.type === 'Switch' && node === parentNode.alternate) {
    /*
     * Alternates for `switch` statements are in return position iff the
     * `switch` itself is:
     *
     *   switch notImplicitlyReturned
     *     …
     *     else mightBeImplicitlyReturned
     */
    return couldContainImplicitReturn(parentNode);
  }

  return false;
}

/**
 * @param {Object} node
 * @returns {boolean}
 * @private
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

/**
 * @param {Object} node
 * @returns {boolean}
 */
function explicitlyReturns(node) {
  let result = false;
  traverse(node, child => {
    if (result) {
      // Already found a return, just bail.
      return false;
    } else if (isFunction(child)) {
      // Don't look inside functions.
      return false;
    } else if (child.type === 'Return') {
      result = true;
      return false;
    }
  });
  return result;
}
