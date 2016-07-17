/* @flow */
import AssignOpPatcher from '../stages/main/patchers/AssignOpPatcher.js';
import FunctionApplicationPatcher from '../stages/main/patchers/FunctionApplicationPatcher.js';
import MemberAccessOpPatcher from '../stages/main/patchers/MemberAccessOpPatcher.js';
import DynamicMemberAccessOpPatcher from '../stages/main/patchers/DynamicMemberAccessOpPatcher.js';
import SoakedDynamicMemberAccessOpPatcher from '../stages/main/patchers/SoakedDynamicMemberAccessOpPatcher.js';
import SoakedFunctionApplicationPatcher from '../stages/main/patchers/SoakedFunctionApplicationPatcher.js';
import SoakedMemberAccessOpPatcher from '../stages/main/patchers/SoakedMemberAccessOpPatcher.js';

import type NodePatcher from '../patchers/NodePatcher.js';

/**
 * Find the enclosing node defining the "soak range" for a given soak operation.
 * For example, in the expression `a(b?.c.d())`, returns the `b?.c.d()` node,
 * since that's the chain of operations that will be skipped if `b` is null or
 * undefined.
 */
export default function findSoakContainer(patcher: NodePatcher): NodePatcher {
  let result = patcher;
  while (canParentHandleSoak(result)) {
    result = result.parent;
  }
  return result;
}

/**
 * Determine if this "soak range" can be expanded outward.
 */
function canParentHandleSoak(patcher: NodePatcher): boolean {
  if (patcher.parent === null) {
    return false;
  }
  if (patcher.isSurroundedByParentheses()) {
    return false;
  }
  if (patcher.parent instanceof MemberAccessOpPatcher
      && !(patcher.parent instanceof SoakedMemberAccessOpPatcher)) {
    return true;
  }
  if (patcher.parent instanceof DynamicMemberAccessOpPatcher
      && !(patcher.parent instanceof SoakedDynamicMemberAccessOpPatcher)
      && patcher.parent.expression === patcher) {
    return true;
  }
  if (patcher.parent instanceof FunctionApplicationPatcher
      && !(patcher.parent instanceof SoakedFunctionApplicationPatcher)
      && patcher.parent.fn === patcher) {
    return true;
  }
  if (patcher.parent instanceof AssignOpPatcher
      && patcher.parent.assignee === patcher) {
    return true;
  }
  if (['PostIncrementOp', 'PostDecrementOp'].indexOf(patcher.parent.node.type) >= 0) {
    return true;
  }
  if (['PreIncrementOp', 'PreDecrementOp', 'DeleteOp'].indexOf(patcher.parent.node.type) >= 0) {
    throw patcher.parent.error(
      'Expressions like `++a?.b`, `--a?.b`, and `delete a?.b` are not supported yet.'
    );
  }
  return false;
}
