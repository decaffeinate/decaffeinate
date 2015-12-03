/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isFunction(node) {
  return node.type === 'Function' || node.type === 'BoundFunction';
}

/**
 * Determines whether a node represents a `for` loop.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isForLoop(node) {
  return node.type === 'ForIn' || node.type === 'ForOf';
}

/**
 * Determines whether a node represents a `while` loop.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isWhile(node) {
  return node.type === 'While';
}

/**
 * Determines whether a node is the true-part or false-part of a conditional.
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isConsequentOrAlternate(node) {
  const parentNode = node.parentNode;
  return parentNode.type === 'Conditional' && (
    parentNode.consequent === node || parentNode.alternate === node);
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
export function isBinaryOperator(node) {
  switch (node.type) {
    case 'BitAndOp':
    case 'BitOrOp':
    case 'DivideOp':
    case 'EQOp':
    case 'GTEOp':
    case 'GTOp':
    case 'InOp':
    case 'InstanceofOp':
    case 'LTEOp':
    case 'LTOp':
    case 'LogicalAndOp':
    case 'MultiplyOp':
    case 'NEQOp':
    case 'OfOp':
    case 'PlusOp':
    case 'RemOp':
    case 'SubtractOp':
      return true;

    default:
      return false;
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
export function isCall(node) {
  switch (node && node.type) {
    case 'FunctionApplication':
    case 'NewOp':
      return true;

    default:
      return false;
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
export function isCallArgument(node) {
  if (node && isCall(node.parentNode)) {
    return node.parentNode.arguments.indexOf(node) >= 0;
  } else {
    return false;
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
export function isShorthandThisObjectMember(node) {
  return node.type === 'ObjectInitialiserMember' && /^@\w+$/.test(node.raw);
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
export function isStaticMethod(node) {
  if (node.type !== 'AssignOp') {
    return false;
  }

  const { assignee } = node;

  if (assignee.type !== 'MemberAccessOp') {
    return false;
  }

  if (node.expression.type !== 'Function') {
    return false;
  }

  return assignee.expression.type === 'This' || (
    assignee.expression.type === 'Identifier' &&
    assignee.expression.data === node.parentNode.parentNode.name.data
  );
}
