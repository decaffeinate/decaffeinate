import determineIndent from '../utils/determineIndent';
import getIndent from '../utils/getIndent';
import isExpressionResultUsed from '../utils/isExpressionResultUsed'

/**
 * Converts `switch` used as an expression to `switch` inside an IIFE.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function preprocessSwitch(node, patcher) {
  if (node.type === 'Switch' && isExpressionResultUsed(node)) {
    const source = patcher.original;
    const indent = determineIndent(source);
    patcher.insert(node.range[0], `do ->\n${getIndent(source, node.range[0]) + indent}`);

    let index = source.indexOf('\n', node.range[0]);

    while (0 <= index && index < node.range[1]) {
      patcher.insert(index + '\n'.length, indent);
      index = source.indexOf('\n', index + '\n'.length);
    }

    return true;
  }
}
