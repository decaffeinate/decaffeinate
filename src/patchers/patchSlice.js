import replaceBetween from '../utils/replaceBetween';
import { strictEqual } from 'assert';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchSliceStart(node, patcher) {
  let { parentNode } = node;
  if (parentNode && parentNode.type === 'Slice') {
    if (parentNode.left === node) {
      replaceBetween(patcher, parentNode.expression, node, '[', '.slice(');
    } else if (parentNode.right === node) {
      replaceBetween(
        patcher,
        parentNode.left,
        node,
        parentNode.isInclusive ? '..' : '...',
        ', '
      );

      if (parentNode.isInclusive) {
        if (node.type === 'Int') {
          patcher.overwrite(node.range[0], node.range[1], `${node.data + 1}`);
        } else {
          patcher.insert(node.range[1], ' + 1');
        }
      }
    }
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchSliceEnd(node, patcher) {
  let { parentNode } = node;
  if (parentNode && parentNode.type === 'Slice') {
    if (parentNode.left === node) {
      if (!parentNode.right) {
        patcher.overwrite(node.range[1], parentNode.range[1], ')');
      }
    } else if (parentNode.right === node) {
      strictEqual(
        patcher.original[parentNode.range[1] - 1],
        ']',
        'last character of Slice node must be "]"'
      );
      patcher.overwrite(parentNode.range[1] - 1, parentNode.range[1], ')');
    }
  }
}
