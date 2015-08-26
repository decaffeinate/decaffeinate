import getIndent from './getIndent';

/**
 * @param {MagicString} patcher
 * @param {string[]} lines
 * @param {Object} node
 */
export default function prependLinesToBlock(patcher, lines, node) {
  const indent = getIndent(patcher.original, node.range[0]);
  patcher.insert(
    node.range[0],
    lines.map(line => `${line}\n${indent}`).join('')
  );
}
