import adjustIndent from '../utils/adjustIndent.js';
import getIndent from '../utils/getIndent.js';
import indentNode from '../utils/indentNode.js';
import sourceBetween from '../utils/sourceBetween.js';

/**
 * Re-order `for` loop parts if the body precedes the rest.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function ensureMultilineLoop(node, patcher) {
  let { keyAssignee, valAssignee, body } = node;
  let firstAssignee = null;
  let lastHeaderPart = null;
  let keyword = null;

  switch (node.type) {
    case 'ForOf':
      firstAssignee = keyAssignee;
      lastHeaderPart = node.target;
      keyword = node.isOwn ? 'for own' : 'for';
      break;

    case 'ForIn':
      firstAssignee = valAssignee;
      lastHeaderPart = node.target;
      keyword = 'for';
      break;

    case 'While':
      firstAssignee = node.condition;
      lastHeaderPart = node.condition;
      keyword = 'while';
      break;
  }

  if (!firstAssignee) {
    return false;
  }

  if (body.range[0] < firstAssignee.range[0]) {
    // e.g. `k for k of o` -> `for k of o\n  k`
    patcher.remove(body.range[0], firstAssignee.range[0] - `${keyword} `.length);
    patcher.insert(node.range[1], `\n${adjustIndent(patcher.original, node.range[0], 1)}${body.raw}`);
    return true;
  }

  let hasThen = sourceBetween(patcher.original, lastHeaderPart, body).indexOf('\n') < 0;

  if (hasThen) {
    // e.g. `for k of o then k` -> `for k of o\n  k`
    patcher.overwrite(lastHeaderPart.range[1], body.range[0], `\n${getIndent(patcher.original, node.range[0])}`);
    indentNode(node.body, patcher);
    return true;
  }

  return false;
}
