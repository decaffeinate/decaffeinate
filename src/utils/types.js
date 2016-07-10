/* @flow */

import type { Node, SourceToken } from '../patchers/types.js';
import { COMMENT, HERECOMMENT, NEWLINE } from 'coffee-lex';
import { inspect } from 'util';

/**
 * Determines whether the node is a boolean, optionally with the given value.
 */
export function isBool(node: Node, value?: ?(boolean | string)=undefined): boolean {
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
      throw new Error(`Invalid boolean test value: ${inspect(value)}. Expected a boolean or string.`);
  }
}

/**
 * Determines whether a node is a member access operation.
 */
export function isMemberAccessOp(node: Node): boolean {
  return isStaticMemberAccessOp(node) || isDynamicMemberAccessOp(node);
}

/**
 * Determines whether a node is a static member access, e.g. `a.b`.
 */
export function isStaticMemberAccessOp(node: Node): boolean {
  switch (node.type) {
    case 'MemberAccessOp':
    case 'ProtoMemberAccessOp':
    case 'SoakedMemberAccessOp':
    case 'SoakedProtoMemberAccessOp':
      return true;

    default:
      return false;
  }
}

/**
 * Determines whether a node is a dynamic member access, e.g. `a[b]`.
 */
export function isDynamicMemberAccessOp(node: Node): boolean {
  switch (node.type) {
    case 'DynamicMemberAccessOp':
    case 'DynamicProtoMemberAccessOp':
    case 'SoakedDynamicMemberAccessOp':
    case 'SoakedDynamicProtoMemberAccessOp':
      return true;

    default:
      return false;
  }
}

/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 */
export function isFunction(node: Node, allowBound: boolean=true): boolean {
  return node.type === 'Function' || node.type === 'GeneratorFunction' || (allowBound && node.type === 'BoundFunction');
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
 */
export function isFunctionBody(node: Node, allowBound: boolean=true): boolean {
  let { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  return isFunction(parentNode, allowBound) && parentNode.body === node;
}

/**
 * Determines whether the node is a conditional (i.e. `if` or `unless`).
 */
export function isConditional(node: Node): boolean {
  return node.type === 'Conditional';
}

/**
 * Determines whether a node represents a `for` loop.
 */
export function isForLoop(node: Node): boolean {
  return node.type === 'ForIn' || node.type === 'ForOf';
}

/**
 * Determines whether a node represents a `while` loop.
 */
export function isWhile(node: Node): boolean {
  return node.type === 'While';
}

/**
 * Determines whether a node is the true-part or false-part of a conditional.
 */
export function isConsequentOrAlternate(node: Node): boolean {
  let { parentNode } = node;
  return parentNode && parentNode.type === 'Conditional' && (
    parentNode.consequent === node ||
    parentNode.alternate === node
  );
}

export function isBinaryOperator(node: Node): boolean {
  switch (node.type) {
    case 'BitAndOp':
    case 'BitOrOp':
    case 'BitXorOp':
    case 'DivideOp':
    case 'EQOp':
    case 'ExistsOp':
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
    case 'SeqOp':
    case 'SignedRightShiftOp':
    case 'SubtractOp':
    case 'UnsignedRightShiftOp':
      return true;

    default:
      return false;
  }
}

export function isCall(node: Node): boolean {
  switch (node && node.type) {
    case 'FunctionApplication':
    case 'NewOp':
      return true;

    default:
      return false;
  }
}

export function isCallArgument(node: Node): boolean {
  if (node && isCall(node.parentNode)) {
    return node.parentNode.arguments.indexOf(node) >= 0;
  } else {
    return false;
  }
}

export function isShorthandThisObjectMember(node: Node): boolean {
  return node.type === 'ObjectInitialiserMember' && /^@\w+$/.test(node.raw);
}

export function isStaticMethod(node: Node): boolean {
  if (node.type !== 'AssignOp') {
    return false;
  }

  if (!node.parentNode.parentNode || node.parentNode.parentNode.type !== 'Class') {
    return false;
  }

  let { assignee } = node;

  if (assignee.type !== 'MemberAccessOp') {
    return false;
  }

  if (node.expression.type !== 'Function') {
    return false;
  }

  if (node.expression.type !== 'GeneratorFunction') {
    return false;
  }

  return assignee.expression.type === 'This' || (
    assignee.expression.type === 'Identifier' &&
    assignee.expression.data === node.parentNode.parentNode.name.data
  );
}

const NON_SEMANTIC_SOURCE_TOKEN_TYPES = [COMMENT, HERECOMMENT, NEWLINE];

/**
 * This isn't a great name because newlines do have semantic meaning in
 * CoffeeScript, but it's close enough.
 */
export function isSemanticToken(token: SourceToken): boolean {
  return NON_SEMANTIC_SOURCE_TOKEN_TYPES.indexOf(token.type) < 0;
}
