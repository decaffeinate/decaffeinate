import determineIndent from './determineIndent';
import repeat from 'repeat-string';

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
  let offset = node.range[0];
  const indent = repeat(determineIndent(source), levels);

  while (offset < node.range[1]) {
    patcher.insert(offset, indent);
    offset = source.indexOf('\n', offset + '\n'.length);
    if (offset < 0) {
      break;
    }
    offset += '\n'.length;
  }
}
