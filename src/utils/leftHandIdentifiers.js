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
    return node.members.reduce(
      (acc, member) => acc.concat(leftHandIdentifiers(member)),
      []
    );
  } else if (node.type === 'ObjectInitialiser') {
    return node.members.reduce(
      (acc, member) => acc.concat(leftHandIdentifiers(member.expression)),
      []
    );
  } else {
    return [];
  }
}
