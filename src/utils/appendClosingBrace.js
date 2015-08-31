import getIndent from '../utils/getIndent';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Adds a closing curly brace on a new line after a node with the proper indent.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function appendClosingBrace(node, patcher) {
  const source = patcher.original;
  patcher.insert(
    trimmedNodeRange(node, source)[1],
    `\n${getIndent(source, node.range[0])}}`
  );
}
