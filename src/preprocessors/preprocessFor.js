import adjustIndent from '../utils/adjustIndent';
import getFreeBinding, { getFreeLoopBinding } from '../utils/getFreeBinding';
import getIndent from '../utils/getIndent';
import indentNode from '../utils/indentNode';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isSafeToRepeat from '../utils/isSafeToRepeat';
import prependLinesToBlock from '../utils/prependLinesToBlock';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Normalize `for` loops for easier patching.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessFor(node, patcher) {
  if (ensureMultilineForLoop(node, patcher)) {
    return true;
  } else if (wrapForLoopInIIFE(node, patcher)) {
    return true;
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
 * Re-order `for` loop parts if the body precedes the rest.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
function ensureMultilineForLoop(node, patcher) {
  const { keyAssignee, valAssignee, body } = node;
  let firstAssignee = null;

  if (node.type === 'ForOf') {
    firstAssignee = keyAssignee;
  } else if (node.type === 'ForIn') {
   firstAssignee = valAssignee;
  }

  if (!firstAssignee) {
    return false;
  }

  if (body.range[0] >= firstAssignee.range[0]) {
    return false;
  }

  // e.g. `k for k of o` -> `for k of o\n  k`
  patcher.remove(body.range[0], firstAssignee.range[0] - 'for '.length);
  patcher.insert(node.range[1], `\n${adjustIndent(patcher.original, node.range[0], 1)}${body.raw}`);
  return true;
}

/**
 * If the `for` loop is used as an expression we wrap it in an IIFE.
 *
 * @param node
 * @param patcher
 * @returns {boolean}
 */
function wrapForLoopInIIFE(node, patcher) {
  if (node.type !== 'ForIn' && node.type !== 'ForOf') {
    return false;
  }

  if (!isExpressionResultUsed(node)) {
    return false;
  }

  const result = getFreeBinding(node.scope, 'result');

  let thisIndent = getIndent(patcher.original, node.range[0]);
  let nextIndent = adjustIndent(patcher.original, node.range[0], 1);
  patcher.insert(node.range[0], `do =>\n${nextIndent}${result} = []\n${thisIndent}`);
  indentNode(node, patcher);
  let lastStatement = node.body.statements[node.body.statements.length - 1];
  patcher.insert(lastStatement.range[0], `${result}.push(`);
  patcher.insert(lastStatement.range[1], `)`);
  patcher.insert(trimmedNodeRange(node, patcher.original)[1], `\n${nextIndent}${result}`);

  return true;
}
