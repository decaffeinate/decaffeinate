import getIndent from './getIndent.js';
import indentNode from './indentNode.js';
import trimmedNodeRange from './trimmedNodeRange.js';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function makeIIFE(node, patcher) {
  let range = trimmedNodeRange(node, patcher.original);
  let indent = getIndent(patcher.original, range[0]);
  patcher.insert(range[0], `(=>\n${indent}`);
  indentNode(node, patcher);
  patcher.insert(range[1], ')()');
}
