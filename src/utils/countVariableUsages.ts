import { traverse, Identifier, Node, MemberAccessOp, ObjectInitialiserMember } from 'decaffeinate-parser';

/**
 * Gets the number of usages of the given name in the given node.
 */
export default function countVariableUsages(node: Node, name: string): number {
  let numUsages = 0;

  traverse(node, (child) => {
    // Make sure it's the name we're looking for.
    if (!(child instanceof Identifier) || child.data !== name) {
      return;
    }

    // Skip `b` in `a.b`.
    if (child.parentNode instanceof MemberAccessOp && child.parentNode.member === child) {
      return;
    }

    // Skip `a` in `{ a: b }`, but not in `{ a }` or `{ [a]: b }`.
    if (
      child.parentNode instanceof ObjectInitialiserMember &&
      child.parentNode.key === child &&
      // `{ a }`
      child.parentNode.expression !== null &&
      // `{ [a]: b }`
      !child.parentNode.isComputed
    ) {
      return;
    }

    numUsages += 1;
  });

  return numUsages;
}
