/**
 * Determine the keys explicitly removed from this object assignment, so that we know which keys to
 * omit when processing a rest operation.
 */
import AssignOpPatcher from '../stages/main/patchers/AssignOpPatcher';
import IdentifierPatcher from '../stages/main/patchers/IdentifierPatcher';
import ObjectInitialiserMemberPatcher from '../stages/main/patchers/ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from '../stages/main/patchers/ObjectInitialiserPatcher';

export default function getObjectAssigneeKeys(node: ObjectInitialiserPatcher): Array<string> {
  let results: Array<string> = [];
  for (let member of node.members) {
    // We ignore non-identifier keys, since CoffeeScript doesn't seem to handle them properly.
    if (member instanceof ObjectInitialiserMemberPatcher && member.key instanceof IdentifierPatcher) {
      results.push(member.key.node.data);
    } else if (member instanceof AssignOpPatcher && member.assignee instanceof IdentifierPatcher) {
      results.push(member.assignee.node.data);
    }
  }
  return results;
}
