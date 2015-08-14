import getIndent from '../utils/getIndent';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import requiresParentheses from '../utils/requiresParentheses';
import sourceBetween from '../utils/sourceBetween';
import { ok } from 'assert';

/**
 * Convert non-standard `while` loops into typical loops.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessWhile(node, patcher) {
  if (node.type === 'While') {
    if (isExpressionResultUsed(node)) {
      throw new Error(`decaffeinate does not yet support using while loops to collect values:\n${node.raw}`);
    } else if (node.body.range[0] === node.range[0]) {
      // a while b
      let whileIndex = patcher.original.indexOf('while', node.body.range[1]);
      ok(
        whileIndex < node.condition.range[0],
        'BUG: no "while" found between its body and condition'
      );
      const body = node.body.raw;
      patcher.remove(node.body.range[0], whileIndex);
      patcher.insert(node.condition.range[1], `\n${getIndent(patcher.original, node.range[0])}  ${body}`);
      return true;
    } else if (patcher.slice(node.range[0], node.range[0] + 'until'.length) === 'until') {
      // Handle "until" loops.
      patcher.overwrite(node.range[0], node.range[0] + 'until'.length, 'while');
      let condition = node.condition.expression;
      if (requiresParentheses(condition)) {
        patcher.insert(condition.range[0], '!(');
        patcher.insert(condition.range[1], ')');
      } else {
        patcher.insert(condition.range[0], '!');
      }
      return true;
    } else if (patcher.slice(node.range[0], node.range[0] + 'loop'.length) === 'loop') {
      patcher.overwrite(node.range[0], node.range[0] + 'loop'.length, 'while true');
      return true;
    }
  }
}
