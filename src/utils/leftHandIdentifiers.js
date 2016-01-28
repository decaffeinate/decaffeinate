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
 *
 * @param {Object} node
 * @returns {Object[]}
 */
export default function leftHandIdentifiers(node) {
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
