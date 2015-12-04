import appendClosingBrace from '../utils/appendClosingBrace';
import isSurroundedBy from '../utils/isSurroundedBy';
import replaceBetween from '../utils/replaceBetween';
import { isStaticMethod } from '../utils/types';

/**
 * Patches the start of class-related nodes.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchClassStart(node, patcher) {
  const { parentNode } = node;

  if (node.type === 'Class') {
    if (node.body) {
      let braceIndex;
      const superclass = node.parent;

      if (superclass) {
        braceIndex = superclass.range[1];
        if (isSurroundedBy(superclass, '(', patcher.original)) {
          braceIndex += '('.length;
        }
      } else {
        braceIndex = node.nameAssignee.range[1];
      }

      patcher.insert(braceIndex, ' {');
    }
  } else if (isClassProtoAssignExpression(node)) {
    if (!replaceBetween(patcher, parentNode.assignee, node, ' : ', ' = ')) {
      if (!replaceBetween(patcher, parentNode.assignee, node, ': ', ' = ')) {
        replaceBetween(patcher, parentNode.assignee, node, ':', ' = ');
      }
    }
  } else if (isStaticMethod(node)) {
    const { assignee } = node;
    assignee._rewritten = true;
    assignee.expression._rewritten = true;
    patcher.overwrite(
      assignee.expression.range[0],
      assignee.range[1] - assignee.memberName.length,
      'static '
    );
    patcher.remove(
      assignee.range[1],
      node.expression.range[0]
    );
  }
}

/**
 * Patches the end of class-related nodes.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchClassEnd(node, patcher) {
  if (node.type === 'Class') {
    if (node.body) {
      appendClosingBrace(node, patcher);
    } else {
      if (!node.nameAssignee) {
        patcher.insert(node.range[0], '(');
        patcher.insert(node.range[1], ' {})');
      } else {
        patcher.insert(node.range[1], ' {}');
      }
    }
  } else if (isClassProtoAssignExpression(node)) {
    patcher.insert(node.range[1], ';');
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function isClassProtoAssignExpression(node) {
  const { parentNode } = node;
  return parentNode &&
    parentNode.type === 'ClassProtoAssignOp' &&
    node === parentNode.expression &&
    node.type !== 'Function';
}
