import getIndent from './getIndent';
import indentNode from './indentNode';
import trimmedNodeRange from './trimmedNodeRange';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function makeIIFE(node, patcher) {
  const range = trimmedNodeRange(node, patcher.original);
  const indent = getIndent(patcher.original, range[0]);
  patcher.insert(range[0], `(=>\n${indent}`);
  indentNode(node, patcher);
  patcher.insert(range[1], ')()');
}
