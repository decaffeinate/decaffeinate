import { traverse } from 'decaffeinate-parser';
import { Identifier, Node } from 'decaffeinate-parser/dist/nodes';

/**
 * Gets the number of usages of the given name in the given node.
 */
export default function countVariableUsages(node: Node, name: string): number {
  let numUsages = 0;
  traverse(node, child => {
    if (child instanceof Identifier && child.data === name) {
      numUsages += 1;
    }
  });
  return numUsages;
}
