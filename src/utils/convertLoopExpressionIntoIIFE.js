import adjustIndent from '../utils/adjustIndent';
import getFreeBinding from '../utils/getFreeBinding';
import getIndent from '../utils/getIndent';
import indentNode from '../utils/indentNode';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * If the `for` loop is used as an expression we wrap it in an IIFE.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function convertLoopExpressionIntoIIFE(node, patcher) {
  if (!isExpressionResultUsed(node)) {
    return false;
  }

  const result = getFreeBinding(node.scope, 'result');

  let thisIndent = getIndent(patcher.original, node.range[0]);
  let nextIndent = adjustIndent(patcher.original, node.range[0], 1);
  patcher.insert(node.range[0], `do =>\n${nextIndent}${result} = []\n${thisIndent}`);
  indentNode(node, patcher);
  let lastStatement = node.body.statements[node.body.statements.length - 1];
  patcher.insert(lastStatement.range[0], `${result}.push(`);
  patcher.insert(lastStatement.range[1], `)`);
  patcher.insert(trimmedNodeRange(node, patcher.original)[1], `\n${nextIndent}${result}`);

  return true;
}
