/* @flow */

import { SourceType } from 'coffee-lex';
import type NodePatcher from '../patchers/NodePatcher';

/**
 * Determine if the given postfix if/while/for needs to have parens wrapped
 * around it while it is reordered. This happens when the expression has a comma
 * after it as part of a list (function args, array initializer, or object
 * initializer).
 */
export default function postfixNodeNeedsOuterParens(patcher: NodePatcher): boolean {
  let nextToken = patcher.nextToken();
  if (nextToken) {
    return nextToken.type === SourceType.COMMA;
  }
  return false;
}
