import convertLoopExpressionIntoIIFE from '../utils/convertLoopExpressionIntoIIFE';
import ensureMultilineLoop from '../utils/ensureMultilineLoop';
import requiresParentheses from '../utils/requiresParentheses';
import { isWhile } from '../utils/types';

const LOOP_KEYWORD = 'loop';
const UNTIL_KEYWORD = 'until';
const WHILE_KEYWORD = 'while';

/**
 * Convert non-standard `while` loops into typical loops.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessWhile(node, patcher) {
  if (isWhile(node)) {
    if (convertLoopToWhileTrue(node, patcher)) {
      return true;
    } else if (convertUntilToWhile(node, patcher)) {
      return true;
    } else if (ensureMultilineLoop(node, patcher)) {
      return true;
    } else if (convertLoopExpressionIntoIIFE(node, patcher)) {
      return true;
    }
  }
}

/**
 * Convert `loop` into `while true`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
function convertLoopToWhileTrue(node, patcher) {
  if (isWhile(node) && patcher.slice(node.range[0], node.range[0] + LOOP_KEYWORD.length) === LOOP_KEYWORD) {
    patcher.overwrite(node.range[0], node.range[0] + LOOP_KEYWORD.length, 'while true');
    return true;
  }

  return false;
}

/**
 * Convert `until` into a negated `while`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
function convertUntilToWhile(node, patcher) {
  if (isWhile(node) && patcher.slice(node.range[0], node.range[0] + UNTIL_KEYWORD.length) === UNTIL_KEYWORD) {
    // Handle "until" loops.
    patcher.overwrite(node.range[0], node.range[0] + UNTIL_KEYWORD.length, WHILE_KEYWORD);
    let condition = node.condition.expression;
    if (requiresParentheses(condition)) {
      patcher.insert(condition.range[0], '!(');
      patcher.insert(condition.range[1], ')');
    } else {
      patcher.insert(condition.range[0], '!');
    }
    return true;
  }
}
