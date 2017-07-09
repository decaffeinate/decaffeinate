import NodePatcher from '../patchers/NodePatcher';
import AssignOpPatcher from '../stages/main/patchers/AssignOpPatcher';
import DynamicMemberAccessOpPatcher from '../stages/main/patchers/DynamicMemberAccessOpPatcher';
import FunctionPatcher from '../stages/main/patchers/FunctionPatcher';
import MemberAccessOpPatcher from '../stages/main/patchers/MemberAccessOpPatcher';

export type PrototypeAssignPatchers = {
  classRefPatcher: NodePatcher;
  // Either a MemberAccessOpPatcher or a DynamicMemberAccessOpPatcher.
  methodAccessPatcher: NodePatcher;
};

/**
 * Given a main stage patcher, determine if it assigns a function to a class
 * prototype. This means that a super call within the function needs access to
 * the enclosing function.
 */
export default function extractPrototypeAssignPatchers(patcher: NodePatcher): PrototypeAssignPatchers | null {
  if (!(patcher instanceof AssignOpPatcher) ||
      !(patcher.expression instanceof FunctionPatcher) ||
      !(patcher.assignee instanceof MemberAccessOpPatcher ||
      patcher.assignee instanceof DynamicMemberAccessOpPatcher) ||
      !(patcher.assignee.expression instanceof MemberAccessOpPatcher) ||
      patcher.assignee.expression.member.node.data !== 'prototype') {
    return null;
  }
  return {
    classRefPatcher: patcher.assignee.expression.expression,
    methodAccessPatcher: patcher.assignee,
  };
}
