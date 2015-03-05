import getIndent from '../utils/getIndent';
import replaceBetween from '../utils/replaceBetween';
import sourceBetween from '../utils/sourceBetween';

/**
 * Adds punctuation to `if` statements and converts `if` expressions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchConditionalStart(node, patcher) {
  if (isCondition(node)) {
    patcher.insert(node.range[0], '(');
  }
}

/**
 * Adds punctuation to `if` statements and converts `if` expressions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchConditionalEnd(node, patcher) {
  if (isCondition(node)) {
    replaceBetween(patcher, node, node.parent.consequent, 'then ', '') ||
      replaceBetween(patcher, node, node.parent.consequent, 'then', '');
    patcher.insert(node.range[1], ') {');
  } else if (isConsequent(node) && node.parent.alternate) {
    // Only add the opening curly for the alternate if it is not a conditional,
    // otherwise the handler for the end of its condition will add it.
    replaceBetween(
      patcher,
      node,
      node.parent.alternate,
      'else',
      `} else${node.parent.alternate.type === 'Conditional' ? '' : ' {'}`
    );
  } else if (node.type === 'Conditional' && (!node.alternate || node.alternate.type !== 'Conditional')) {
    // Close the conditional if it isn't handled by closing an `else if`.
    if (node.condition.line === node.consequent.line) {
      patcher.insert(node.range[1], ' }');
    } else {
      patcher.insert(node.range[1], `\n${getIndent(patcher.original, node.range[0])}}`);
    }
  }
}

/**
 * Determines whether a node is a Conditional node's condition.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isCondition(node) {
  return node.parent ? node.parent.type === 'Conditional' && node.parent.condition === node : false;
}

/**
 * Determines whether a node is a Conditional node's consequent.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isConsequent(node) {
  return node.parent ? node.parent.type === 'Conditional' && node.parent.consequent === node : false;
}

/**
 * Determines whether a node is a Conditional node's alternate.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isAlternate(node) {
  return node.parent ? node.parent.type === 'Conditional' && node.parent.alternate === node : false;
}
