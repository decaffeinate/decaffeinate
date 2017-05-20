/**
 * @flow
 */
import type { Node } from '../patchers/types';

/**
 * Determine the variables introduced by this assignee (array destructure,
 * object destructure, rest, etc.).
 */
export default function getAssigneeBindings(node: Node): Array<string> {
  if (node.type === 'Identifier') {
    return [node.data];
  } else if (node.type === 'ArrayInitialiser') {
    let bindings = [];
    for (let member of node.members) {
      bindings.push(...getAssigneeBindings(member));
    }
    return bindings;
  } else if (node.type === 'ObjectInitialiser') {
    let bindings = [];
    for (let member of node.members) {
      bindings.push(...getAssigneeBindings(member));
    }
    return bindings;
  } else if (node.type === 'ObjectInitialiserMember') {
    return getAssigneeBindings(node.expression);
  } else if (node.type === 'AssignOp') {
    return getAssigneeBindings(node.assignee);
  } else if (node.type === 'Spread' || node.type === 'Rest') {
    return getAssigneeBindings(node.expression);
  }
  return [];
}
