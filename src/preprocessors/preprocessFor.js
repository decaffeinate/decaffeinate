import convertLoopExpressionIntoIIFE from '../utils/convertLoopExpressionIntoIIFE';
import ensureMultilineLoop from '../utils/ensureMultilineLoop';
import getFreeBinding, { getFreeLoopBinding } from '../utils/getFreeBinding';
import getIndent from '../utils/getIndent';
import indentNode from '../utils/indentNode';
import isSafeToRepeat from '../utils/isSafeToRepeat';
import prependLinesToBlock from '../utils/prependLinesToBlock';
import { isForLoop } from '../utils/types';

/**
 * Normalize `for` loops for easier patching.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessFor(node, patcher) {
  if (isForLoop(node)) {
    if (ensureMultilineLoop(node, patcher)) {
      return true;
    } else if (convertLoopExpressionIntoIIFE(node, patcher)) {
      return true;
    } else if (convertFilterIntoBodyConditional(node, patcher)) {
      return true;
    }
  }

  const { keyAssignee, valAssignee, target, scope } = node;

  if (node.type === 'ForOf') {
    if (valAssignee) {
      // e.g. `for k, v of o` -> `for k of o` and `v = o[k]`
      let canRepeatIterable = isSafeToRepeat(target);
      let iterable = canRepeatIterable ? target.raw : getFreeBinding(scope, 'iterable');

      if (!canRepeatIterable) {
        patcher.overwrite(target.range[0], target.range[1], `(${iterable} = ${target.raw})`);
      }

      let assignments = [];
      let key = keyAssignee.raw;

      if (keyAssignee.type !== 'Identifier') {
        // destructured key, use a temporary variable for the key
        key = getFreeBinding(scope, 'key');
        patcher.overwrite(keyAssignee.range[0], keyAssignee.range[1], key);
        assignments.push(`${keyAssignee.raw} = ${key}`);
      }

      // e.g. `for k, v of o` -> `for k in o`
      //            ^^^
      patcher.remove(keyAssignee.range[1], valAssignee.range[1]);
      assignments.push(`${valAssignee.raw} = ${iterable}[${key}]`);
      prependLinesToBlock(patcher, assignments, node.body);
      return true;
    }
  } else if (node.type === 'ForIn') {
    let rewritten = false;

    // Make all for-in loops have a key assignee.
    if (!node.keyAssignee && node.target.type !== 'Range') {
      patcher.insert(node.valAssignee.range[1], `, ${getFreeLoopBinding(node.scope)}`);
      rewritten = true;
    }

    if (node.target.type === 'Range') {
      if (!isSafeToRepeat(node.target.left)) {
        let startBinding = getFreeBinding(node.scope, 'start');
        patcher.insert(
          node.range[0],
          `${startBinding} = ${node.target.left.raw}\n${getIndent(patcher.original, node.range[0])}`
        );
        patcher.overwrite(node.target.left.range[0], node.target.left.range[1], startBinding);
        rewritten = true;
      }
      if (!isSafeToRepeat(node.target.right)) {
        let endBinding = getFreeBinding(node.scope, 'end');
        patcher.insert(
          node.range[0],
          `${endBinding} = ${node.target.right.raw}\n${getIndent(patcher.original, node.range[0])}`
        );
        patcher.overwrite(node.target.right.range[0], node.target.right.range[1], endBinding);
        rewritten = true;
      }
    } else if (!isSafeToRepeat(node.target)) {
      let iterableBinding = getFreeBinding(node.scope, 'iterable');
      patcher.insert(
        node.range[0],
        `${iterableBinding} = ${node.target.raw}\n${getIndent(patcher.original, node.range[0])}`
      );
      patcher.overwrite(node.target.range[0], node.target.range[1], iterableBinding);
      rewritten = true;
    }

    return rewritten;
  }
}

/**
 * If the `for` loop contains a `when` clause we turn it into an `if` in the
 * body of the `for` loop.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
function convertFilterIntoBodyConditional(node, patcher) {
  if (!node.filter) {
    return false;
  }

  const indent = getIndent(patcher.original, node.body.range[0]);
  patcher.insert(node.body.range[0], `if ${node.filter.raw}\n${indent}`);
  patcher.remove(node.filter.range[0] - ' when '.length, node.filter.range[1]);
  indentNode(node.body, patcher);
  return true;
}
