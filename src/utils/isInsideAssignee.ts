import {
  AssignOp,
  CompoundAssignOp,
  DynamicMemberAccessOp,
  FunctionApplication,
  MemberAccessOp,
  Node,
  PostDecrementOp,
  PostIncrementOp,
  PreDecrementOp,
  PreIncrementOp,
  SoakedDynamicMemberAccessOp,
  SoakedMemberAccessOp,
  SoakedNewOp,
  SoakedFunctionApplication,
} from 'decaffeinate-parser/dist/nodes';

/**
 * Determines whether `node` is inside the main path to an assignee.
 *
 * @example
 *
 * ```ts
 * // true for `a[b]`
 * isInsideAssignee(parse('a[b] = 1').body.statements[0].assignee)
 * // true for `a`
 * isInsideAssignee(parse('a[b] = 1').body.statements[0].assignee.expression)
 * // false for `b`
 * isInsideAssignee(parse('a[b] = 1').body.statements[0].assignee.indexingExpr)
 * ```
 */
export default function isInsideAssignee(node: Node): boolean {
  if (!node.parentNode) {
    return false;
  }

  if (node.parentNode instanceof AssignOp || node.parentNode instanceof CompoundAssignOp) {
    return node.parentNode.assignee === node;
  }

  if (
    node.parentNode instanceof PostIncrementOp ||
    node.parentNode instanceof PreIncrementOp ||
    node.parentNode instanceof PostDecrementOp ||
    node.parentNode instanceof PreDecrementOp
  ) {
    return true;
  }

  if (
    node.parentNode instanceof MemberAccessOp ||
    node.parentNode instanceof DynamicMemberAccessOp ||
    node.parentNode instanceof SoakedMemberAccessOp ||
    node.parentNode instanceof SoakedDynamicMemberAccessOp
  ) {
    return node.parentNode.expression === node && isInsideAssignee(node.parentNode);
  }

  if (node.parentNode instanceof SoakedNewOp) {
    return node.parentNode.ctor === node && isInsideAssignee(node.parentNode);
  }

  if (node.parentNode instanceof FunctionApplication || node.parentNode instanceof SoakedFunctionApplication) {
    return node.parentNode.function === node && isInsideAssignee(node.parentNode);
  }

  return false;
}
