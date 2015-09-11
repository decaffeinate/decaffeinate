import adjustIndent from '../utils/adjustIndent';

/**
 * Re-order `for` loop parts if the body precedes the rest.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function ensureMultilineLoop(node, patcher) {
  const { keyAssignee, valAssignee, body } = node;
  let firstAssignee = null;
  let keyword = null;

  switch (node.type) {
    case 'ForOf':
      firstAssignee = keyAssignee;
      keyword = 'for';
      break;

    case 'ForIn':
      firstAssignee = valAssignee;
      keyword = 'for';
      break;

    case 'While':
      firstAssignee = node.condition;
      keyword = 'while';
      break;
  }

  if (!firstAssignee) {
    return false;
  }

  if (body.range[0] >= firstAssignee.range[0]) {
    return false;
  }

  // e.g. `k for k of o` -> `for k of o\n  k`
  patcher.remove(body.range[0], firstAssignee.range[0] - `${keyword} `.length);
  patcher.insert(node.range[1], `\n${adjustIndent(patcher.original, node.range[0], 1)}${body.raw}`);
  return true;
}
