/**
 * Determine if the given assignee (array destructure, object destructure, rest,
 * etc.) can be translated to JavaScript directly. If not, we'll need to expand
 * the assignee into repeated assignments.
 *
 * Notably, we cannot patch default values (assignment operations) to JavaScript
 * since CS falls back to the default if the value is undefined or null, while
 * JS falls back to the default if the value only if the value is undefined.
 */
import {
  ArrayInitialiser,
  AssignOp,
  DynamicMemberAccessOp,
  Elision,
  Expansion,
  Identifier,
  MemberAccessOp,
  Node,
  ObjectInitialiser,
  ObjectInitialiserMember,
  ProtoMemberAccessOp,
  Rest,
  SoakedDynamicMemberAccessOp,
  SoakedMemberAccessOp,
  SoakedProtoMemberAccessOp,
  Spread
} from 'decaffeinate-parser/dist/nodes';
import { Options } from '../options';

export default function canPatchAssigneeToJavaScript(node: Node, options: Options, isTopLevel = true): boolean {
  if (
    node instanceof Identifier ||
    node instanceof MemberAccessOp ||
    node instanceof SoakedMemberAccessOp ||
    node instanceof ProtoMemberAccessOp ||
    node instanceof DynamicMemberAccessOp ||
    node instanceof SoakedDynamicMemberAccessOp ||
    node instanceof SoakedProtoMemberAccessOp ||
    node instanceof Elision
  ) {
    return true;
  }
  if (node instanceof ArrayInitialiser) {
    // Nested array destructures can't convert cleanly because we need to wrap
    // them in Array.from.
    if (!options.useCS2 && !isTopLevel) {
      return false;
    }
    // Empty destructure operations need to result in zero assignments, and thus
    // not call Array.from at all.
    if (node.members.length === 0) {
      return false;
    }
    return node.members.every((member, i) => {
      const isInFinalPosition = i === node.members.length - 1;
      if (isInFinalPosition && member instanceof Expansion) {
        return true;
      }
      if (
        isInFinalPosition &&
        (member instanceof Spread || member instanceof Rest) &&
        !(member.expression instanceof ObjectInitialiser) &&
        canPatchAssigneeToJavaScript(member.expression, options, false)
      ) {
        return true;
      }
      return canPatchAssigneeToJavaScript(member, options, false);
    });
  }
  if (node instanceof ObjectInitialiser) {
    // JS empty destructure crashes if the RHS is undefined or null, so more
    // precisely copy the behavior for empty destructures. CS2 does not have this
    // behavior.
    if (!options.useCS2 && node.members.length === 0) {
      return false;
    }
    return node.members.every((member, i) => {
      const isInFinalPosition = i === node.members.length - 1;
      if (
        isInFinalPosition &&
        (member instanceof Spread || member instanceof Rest) &&
        member.expression instanceof Identifier
      ) {
        return true;
      }
      return canPatchAssigneeToJavaScript(member, options, false);
    });
  }
  if (node instanceof ObjectInitialiserMember) {
    return canPatchAssigneeToJavaScript(node.expression || node.key, options, false);
  }
  // Defaults work in CS2, but top-level assignments are never defaults.
  if (options.useCS2 && node instanceof AssignOp && !isTopLevel) {
    return canPatchAssigneeToJavaScript(node.assignee, options, false);
  }
  return false;
}
