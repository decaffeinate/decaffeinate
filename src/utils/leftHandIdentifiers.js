/* @flow */

import flatMap from './flatMap';
import type Node from '../patchers/types';

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
  if (node.type === 'Identifier') {
    return [node];
  } else if (node.type === 'ArrayInitialiser') {
    return flatMap(node.members, leftHandIdentifiers);
  } else if (node.type === 'ObjectInitialiser') {
    return flatMap(node.members, member => leftHandIdentifiers(member.expression));
  } else {
    return [];
  }
}
