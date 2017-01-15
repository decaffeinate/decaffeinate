import type { Node } from '../patchers/types';

/**
 * Determine if the given assignee (array destructure, object destructure, rest,
 * etc.) can be translated to JavaScript directly. If not, we'll need to expand
 * the assignee into repeated assignments.
 *
 * Notably, we cannot patch default values (assignment operations) to JavaScript
 * since CS falls back to the default if the value is undefined or null, while
 * JS falls back to the default if the value only if the value is undefined.
 */
export default function canPatchAssigneeToJavaScript(node: Node, isTopLevel: boolean = true): boolean {
  if ([
        'Identifier', 'MemberAccessOp', 'SoakedMemberAccessOp', 'ProtoMemberAccessOp',
        'DynamicMemberAccessOp', 'SoakedDynamicMemberAccessOp', 'SoakedProtoMemberAccessOp',
      ].indexOf(node.type) > -1) {
    return true;
  }
  if (node.type === 'ArrayInitialiser') {
    // Nested array destructures can't convert cleanly because we need to wrap
    // them in Array.from.
    if (!isTopLevel) {
      return false;
    }
    return node.members.every((member, i) => {
      let isFinalExpansion = (i === node.members.length - 1) &&
          ['Spread', 'Rest', 'Expansion'].indexOf(member.type) > -1;
      return isFinalExpansion || canPatchAssigneeToJavaScript(member, false);
    });
  }
  if (node.type === 'ObjectInitialiser') {
    return node.members.every(node => canPatchAssigneeToJavaScript(node, false));
  }
  if (node.type === 'ObjectInitialiserMember') {
    return canPatchAssigneeToJavaScript(node.expression, false);
  }
  return false;
}
