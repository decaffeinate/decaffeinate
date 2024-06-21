import {
  Node,
  SoakedDynamicMemberAccessOp,
  SoakedFunctionApplication,
  SoakedMemberAccessOp,
} from 'decaffeinate-parser';
import containsDescendant from './containsDescendant';

/**
 * Determine if there are any soak operations within this subtree of the AST.
 */
export default function nodeContainsSoakOperation(node: Node): boolean {
  return containsDescendant(
    node,
    (child) =>
      child instanceof SoakedDynamicMemberAccessOp ||
      child instanceof SoakedFunctionApplication ||
      child instanceof SoakedMemberAccessOp,
  );
}
