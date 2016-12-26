/* @flow */

import traverse from './traverse';
import type Node from '../patchers/types';

/**
 * Gets the number of usages of the given name in the given node.
 */
export default function countVariableUsages(node: Node, name: string): number {
  let numUsages = 0;
  traverse(node, child => {
    if (child.type === 'Identifier' && child.data === name) {
      numUsages += 1;
    }
  });
  return numUsages;
}
