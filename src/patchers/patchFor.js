import rangeIncludingParentheses from '../utils/rangeIncludingParentheses';
import replaceBetween from '../utils/replaceBetween';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchForStart(node, patcher) {
  const { parentNode } = node;

  if (node.type === 'ForOf') {
    // e.g. `for key of object` -> `for (var key in object)`
    //                                  ^^^^^
    patcher.insert(node.range[0] + 'for '.length, '(var ');
  } else if (parentNode && parentNode.type === 'ForOf' && node === parentNode.target) {
    // e.g. `for key of object` -> `for (var key in object)`
    //              ^^^^                        ^^^^
    replaceBetween(patcher, parentNode.keyAssignee, node, ' of ', ' in ');
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchForEnd(node, patcher) {
  const { parentNode } = node;

  if (parentNode && parentNode.type === 'ForOf' && node === parentNode.target) {
    // e.g. `for key of object` -> `for (var key in object)`
    //                                                    ^
    patcher.insert(rangeIncludingParentheses(node, patcher.original)[1], ') {');
  } else if (node.type === 'ForOf') {
    // add closing brace for `for` loop block
    patcher.insert(trimmedNodeRange(node, patcher.original)[1], '\n}');
  }
}
