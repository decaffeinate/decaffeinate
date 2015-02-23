import getIndent from '../utils/getIndent';

/**
 * Patches the start of class-related nodes.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchClassStart(node, patcher) {
  if (node.type === 'Class') {
    if (node.body) {
      patcher.insert(node.nameAssignee.range[1], ' {');
    }
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
      patcher.insert(node.range[1], `\n${getIndent(patcher.original, node.range[0])}}`);
    } else {
      if (!node.nameAssignee) {
        patcher.insert(node.range[0], '(');
        patcher.insert(node.range[1], ' {})');
      } else {
        patcher.insert(node.range[1], ' {}');
      }
    }
  }
}
