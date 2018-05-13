import NodePatcher from '../patchers/NodePatcher';
import AssignOpPatcher from '../stages/main/patchers/AssignOpPatcher';
import DynamicMemberAccessOpPatcher from '../stages/main/patchers/DynamicMemberAccessOpPatcher';
import FunctionApplicationPatcher from '../stages/main/patchers/FunctionApplicationPatcher';
import MemberAccessOpPatcher from '../stages/main/patchers/MemberAccessOpPatcher';
import SoakedDynamicMemberAccessOpPatcher from '../stages/main/patchers/SoakedDynamicMemberAccessOpPatcher';
import SoakedFunctionApplicationPatcher from '../stages/main/patchers/SoakedFunctionApplicationPatcher';
import SoakedMemberAccessOpPatcher from '../stages/main/patchers/SoakedMemberAccessOpPatcher';
import notNull from './notNull';

/**
 * Find the enclosing node defining the "soak range" for a given soak operation.
 * For example, in the expression `a(b?.c.d())`, returns the `b?.c.d()` node,
 * since that's the chain of operations that will be skipped if `b` is null or
 * undefined.
 */
export default function findSoakContainer(patcher: NodePatcher): NodePatcher {
  let result = patcher;
  while (canParentHandleSoak(result)) {
    result = notNull(result.parent);
  }
  return result;
}

/**
 * Determine if this "soak range" can be expanded outward.
 *
 * In determining the soak range, we also stop when we see other soak
 * operations. For example, in `a?.b?.c`, `a?.b` is used as the soak container
 * for the first soak, which works because the second soak operation will
 * "take over"; if `a` is null or undefined, then `a?.b` will be undefined, so
 * the entire thing will evaluate to undefined. This requires all soak
 * operations to do a null check on their leftmost value, which is why we need
 * to make __guardMethod__ do a null check on the object arg.
 */
function canParentHandleSoak(patcher: NodePatcher): boolean {
  if (patcher.parent === null) {
    return false;
  }
  if (patcher.isSurroundedByParentheses()) {
    return false;
  }
  // If we are currently the `a?.b` in an expression like `a?.b.c?()`, we don't
  // want to expand any further, since method-style soaked function application
  // is a special case and the `.c?(` will be patched. In this case, the `a?.b`
  // is what we should set as our soak container, since the method-style soak
  // implementation will "take over" from that point.
  if (
    (patcher.parent instanceof MemberAccessOpPatcher || patcher.parent instanceof DynamicMemberAccessOpPatcher) &&
    patcher.parent.parent !== null &&
    patcher.parent.parent instanceof SoakedFunctionApplicationPatcher &&
    patcher.parent.parent.fn === patcher.parent
  ) {
    return false;
  }
  if (patcher.parent instanceof MemberAccessOpPatcher && !(patcher.parent instanceof SoakedMemberAccessOpPatcher)) {
    return true;
  }
  if (
    patcher.parent instanceof DynamicMemberAccessOpPatcher &&
    !(patcher.parent instanceof SoakedDynamicMemberAccessOpPatcher) &&
    patcher.parent.expression === patcher
  ) {
    return true;
  }
  if (
    patcher.parent instanceof FunctionApplicationPatcher &&
    !(patcher.parent instanceof SoakedFunctionApplicationPatcher) &&
    patcher.parent.fn === patcher
  ) {
    return true;
  }
  if (patcher.parent instanceof AssignOpPatcher && patcher.parent.assignee === patcher) {
    return true;
  }
  if (
    ['PostIncrementOp', 'PostDecrementOp', 'PreIncrementOp', 'PreDecrementOp', 'DeleteOp'].indexOf(
      patcher.parent.node.type
    ) >= 0
  ) {
    return true;
  }
  return false;
}
