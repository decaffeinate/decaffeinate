/**
 * Determine the variables introduced by this assignee (array destructure,
 * object destructure, rest, etc.).
 */
import { ArrayInitialiser, AssignOp, Identifier, Node, ObjectInitialiser, ObjectInitialiserMember, Rest, Spread } from 'decaffeinate-parser/dist/nodes';

export default function getAssigneeBindings(node: Node): Array<string> {
  if (node instanceof Identifier) {
    return [node.data];
  } else if (node instanceof ArrayInitialiser) {
    let bindings = [];
    for (let member of node.members) {
      bindings.push(...getAssigneeBindings(member));
    }
    return bindings;
  } else if (node instanceof ObjectInitialiser) {
    let bindings = [];
    for (let member of node.members) {
      bindings.push(...getAssigneeBindings(member));
    }
    return bindings;
  } else if (node instanceof ObjectInitialiserMember) {
    return getAssigneeBindings(node.expression || node.key);
  } else if (node instanceof AssignOp) {
    return getAssigneeBindings(node.assignee);
  } else if (node instanceof Spread || node instanceof Rest) {
    return getAssigneeBindings(node.expression);
  }
  return [];
}
