/**
 * Determines whether the node is a boolean, optionally with the given value.
 *
 * @param {Object} node
 * @param {boolean|string=} value
 * @returns {boolean}
 */
export function isBool(node, value=undefined) {
  if (node.type !== 'Bool') {
    return false;
  }

  switch (typeof value) {
    case 'undefined':
      return true;

    case 'boolean':
      return node.data === value;

    case 'string':
      return node.raw === value;

    default:
      throw new Error(`Invalid boolean test value: ${value}. Expected a boolean or string.`);
  }
}

/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 *
 * @param {Object} node
 * @param {boolean=} allowBound
 * @returns {boolean}
 */
export function isFunction(node, allowBound=true) {
  return node.type === 'Function' || (allowBound && node.type === 'BoundFunction');
}

/**
 * Determines  whether a node is the body of a function.
 *
 * @example
 *
 *   -> 1  # the literal `1` is the function body
 *
 *   ->
 *     2   # the block containing `2` as a statement is the function body
 *
 * @param node
 * @param {boolean=} allowBound
 * @returns {boolean}
 */
export function isFunctionBody(node, allowBound=true) {
  const { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  return isFunction(parentNode, allowBound) && parentNode.body === node;
}

/**
 * Determines whether the node is a conditional (i.e. `if` or `unless`).
 *
 * @param {Object} node
 * @returns {boolean}
 */
export function isConditional(node) {
  return node.type === 'Conditional';
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
  const { parentNode } = node;
  return parentNode && parentNode.type === 'Conditional' && (
    parentNode.consequent === node ||
    parentNode.alternate === node
  );
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
    case 'LeftShiftOp':
    case 'LogicalAndOp':
    case 'LogicalOrOp':
    case 'MultiplyOp':
    case 'NEQOp':
    case 'OfOp':
    case 'PlusOp':
    case 'RemOp':
    case 'SignedRightShiftOp':
    case 'SubtractOp':
    case 'UnsignedRightShiftOp':
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

  if (!node.parentNode.parentNode || node.parentNode.parentNode.type !== 'Class') {
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
