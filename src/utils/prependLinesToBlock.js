import getIndent from './getIndent.js';

/**
 * @param {MagicString} patcher
 * @param {string[]} lines
 * @param {Object} node
 */
export default function prependLinesToBlock(patcher, lines, node) {
  let indent = getIndent(patcher.original, node.range[0]);
  let string = '';

  for (let i = 0; i < lines.length; i++) {
    string += `${lines[i]}\n`;
    if (i + 1 === lines.length || lines[i + 1].length > 0) {
      string += indent;
    }
  }

  patcher.insert(node.range[0], string);
}
