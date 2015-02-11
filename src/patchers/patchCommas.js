import stripComments from '../utils/stripComments';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Inserts missing commas in objects, arrays, and calls.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchCommas(node, patcher) {
  switch (node.parent && node.parent.type) {
    case 'ObjectInitialiser':
    case 'ArrayInitialiser':
      patchCommaAfterNode(node, node.parent.members, patcher);
      break;

    case 'FunctionApplication':
      if (node.parent.arguments.indexOf(node) >= 0) {
        patchCommaAfterNode(node, node.parent.arguments, patcher);
      }
      break;
  }
}

/**
 * Inserts missing commas between member and its next sibling.
 *
 * @param {Object} member
 * @param {Object[]} members
 * @param {MagicString} patcher
 */
function patchCommaAfterNode(member, members, patcher) {
  const memberIndex = members.indexOf(member);
  const nextMember = members[memberIndex + 1];

  if (!nextMember) {
    return;
  }

  const nodeRange = trimmedNodeRange(member, patcher.original);
  const sourceBetween = stripComments(patcher.original.slice(member.range[1], nextMember.range[0]));
  if (sourceBetween.indexOf(',') < 0) {
    patcher.insert(nodeRange[1], ',');
  }
}
