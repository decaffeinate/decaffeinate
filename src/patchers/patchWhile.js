import appendClosingBrace from '../utils/appendClosingBrace';
import isSurroundedBy from '../utils/isSurroundedBy';

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
    appendClosingBrace(node, patcher);
  }
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
