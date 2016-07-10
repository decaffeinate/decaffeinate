/* @flow */

import type { Node } from '../patchers/types.js';

/**
 * Determines whether the given node, when used as part of a larger expression
 * node, would require parentheses around it.
 */
export default function requiresParentheses(node: Node): boolean {
  switch (node.type) {
    case 'AssignOp':
    case 'BitAndOp':
    case 'BitOrOp':
    case 'BitXorOp':
    case 'EQOp':
    case 'GTEOp':
    case 'GTOp':
    case 'LTEOp':
    case 'LTOp':
    case 'LogicalAndOp':
    case 'LogicalOrOp':
    case 'NEQOp':
    case 'PlusOp':
    case 'SubtractOp':
      return true;

    default:
      return false;
  }
}
