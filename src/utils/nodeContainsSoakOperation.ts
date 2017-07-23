import { traverse } from 'decaffeinate-parser';
import { Node } from 'decaffeinate-parser/dist/nodes';

/**
 * Determine if there are any soak operations within this subtree of the AST.
 */
export default function nodeContainsSoakOperation(searchNode: Node): boolean {
  let foundSoak = false;
  traverse(searchNode, node => {
    if (foundSoak) {
      return false;
    }
    if (node.type === 'SoakedDynamicMemberAccessOp' ||
        node.type === 'SoakedFunctionApplication' ||
        node.type === 'SoakedMemberAccessOp') {
      foundSoak = true;
    }
    return true;
  });
  return foundSoak;
}
