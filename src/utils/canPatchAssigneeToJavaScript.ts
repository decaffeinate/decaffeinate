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
  ArrayInitialiser, DynamicMemberAccessOp, Expansion, Identifier,
  MemberAccessOp, Node, ObjectInitialiser, ObjectInitialiserMember,
  ProtoMemberAccessOp, Rest, SoakedDynamicMemberAccessOp, SoakedMemberAccessOp,
  SoakedProtoMemberAccessOp, Spread
} from 'decaffeinate-parser/dist/nodes';

export default function canPatchAssigneeToJavaScript(node: Node, isTopLevel: boolean = true): boolean {
  if (node instanceof Identifier || node instanceof MemberAccessOp ||
      node instanceof SoakedMemberAccessOp || node instanceof ProtoMemberAccessOp ||
      node instanceof DynamicMemberAccessOp || node instanceof SoakedDynamicMemberAccessOp ||
      node instanceof SoakedProtoMemberAccessOp) {
    return true;
  }
  if (node instanceof ArrayInitialiser) {
    // Nested array destructures can't convert cleanly because we need to wrap
    // them in Array.from.
    if (!isTopLevel) {
      return false;
    }
    // Empty destructure operations need to result in zero assignments, and thus
    // not call Array.from at all.
    if (node.members.length === 0) {
      return false;
    }
    return node.members.every((member, i) => {
      let isInFinalPosition = i === node.members.length - 1;
      if (isInFinalPosition && member instanceof Expansion) {
        return true;
      }
      if (isInFinalPosition &&
          (member instanceof Spread || member instanceof Rest) &&
          canPatchAssigneeToJavaScript(member.expression)) {
        return true;
      }
      return canPatchAssigneeToJavaScript(member, false);
    });
  }
  if (node instanceof ObjectInitialiser) {
    // JS empty destructure crashes if the RHS is undefined or null, so more
    // precisely copy the behavior for empty destructures.
    if (node.members.length === 0) {
      return false;
    }
    return node.members.every(node => canPatchAssigneeToJavaScript(node, false));
  }
  if (node instanceof ObjectInitialiserMember) {
    return canPatchAssigneeToJavaScript(node.expression || node.key, false);
  }
  return false;
}
