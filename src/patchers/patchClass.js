import getIndent from '../utils/getIndent';
import isSurroundedBy from '../utils/isSurroundedBy';

/**
 * Patches the start of class-related nodes.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchClassStart(node, patcher) {
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
