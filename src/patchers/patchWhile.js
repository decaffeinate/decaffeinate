import getIndent from '../utils/getIndent';
import isSurroundedBy from '../utils/isSurroundedBy';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchWhileStart(node, patcher) {
  if (isWhileCondition(node)) {
    if (!isSurroundedBy(node, '(', patcher.original)) {
      patcher.insert(node.range[0], '(');
    }
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchWhileEnd(node, patcher) {
  if (isWhileCondition(node)) {
    if (isSurroundedBy(node, '(', patcher.original)) {
      patcher.insert(node.range[1] + ')'.length, ' {');
    } else {
      patcher.insert(node.range[1], ') {');
    }
  } else if (node.type === 'While') {
    insertClosingBraceForNode(node, patcher);
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
function insertClosingBraceForNode(node, patcher) {
  const nodeRange = trimmedNodeRange(node, patcher.original);
  patcher.insert(nodeRange[1], `\n${getIndent(patcher.original, node.range[0])}}`);
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function isWhileCondition(node) {
  let { parentNode } = node;

  if (!parentNode) {
    return false;
  } else if (parentNode.type !== 'While') {
    return false;
  } else {
    return parentNode.condition === node;
  }
}
