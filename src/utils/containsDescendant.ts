import { traverse, Node } from 'decaffeinate-parser';

export default function containsDescendant(
  node: Node,
  predicate: (node: Node) => boolean,
  { shouldStopTraversal = () => false }: { shouldStopTraversal?: (node: Node) => boolean } = {},
): boolean {
  let found = false;
  traverse(node, (childNode) => {
    if (found) {
      return false;
    }
    if (predicate(childNode)) {
      found = true;
      return false;
    }
    if (shouldStopTraversal(childNode)) {
      return false;
    }
    return true;
  });
  return found;
}
