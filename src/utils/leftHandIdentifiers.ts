import { ArrayInitialiser, Identifier, Node, ObjectInitialiser } from 'decaffeinate-parser/dist/nodes';
import flatMap from './flatMap';

/**
 * Gets the identifiers for the given LHS value.
 *
 * @example
 *
 *   Given `a`, returns [`a`].
 *   Given `[a, b]`, returns [`a`, `b`].
 *   Given `{a, b: c}`, returns [`a`, `c`].
 *   Given `[a, {b, c: d}]`, returns [`a`, `b`, `d`].
 */
export default function leftHandIdentifiers(node: Node): Array<Node> {
  if (node instanceof Identifier) {
    return [node];
  } else if (node instanceof ArrayInitialiser) {
    return flatMap(node.members, leftHandIdentifiers);
  } else if (node instanceof ObjectInitialiser) {
    return flatMap(node.members, member => leftHandIdentifiers(member.expression));
  } else {
    return [];
  }
}
