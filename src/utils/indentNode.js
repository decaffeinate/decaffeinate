import determineIndent from './determineIndent.js';
import repeat from 'repeating';
import trimmedNodeRange from './trimmedNodeRange.js';

/**
 * Indent a node by the given number of levels.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @param {number=} levels
 */
export default function indentNode(node, patcher, levels=1) {
  if (levels === 0) {
    return;
  }

  const source = patcher.original;
  const range = trimmedNodeRange(node, source);
  let offset = range[0];
  const indent = repeat(determineIndent(source), levels);

  while (offset < range[1]) {
    patcher.insert(offset, indent);
    offset = source.indexOf('\n', offset);
    if (offset < 0) {
      break;
    }
    while (source[offset] === '\n') {
      // Skip empty lines.
      offset += '\n'.length;
    }
  }
}
