import isImplicitObject from '../utils/isImplicitObject';
import isImplicitlyReturned from '../utils/isImplicitlyReturned';
import { isCall, isConsequentOrAlternate, isShorthandThisObjectMember } from '../utils/types';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchObjectStart(node, patcher) {
  if (node.type === 'ObjectInitialiser') {
    if (!isCall(node.parentNode)) {
      if (isObjectAsStatement(node)) {
        patcher.insert(node.range[0], '(');
      }
      if (isImplicitObject(node, patcher.original)) {
        patcher.insert(node.range[0], '{');
      }
    } else {
      if (node !== node.parentNode.arguments[0]) {
        // Not the first argument, which is handled by `patchCalls`, so we handle it.
        if (isImplicitObject(node, patcher.original)) {
          patcher.insert(node.range[0], '{');
        }
      }
    }
  } else if (node.type === 'ObjectInitialiserMember' && node.expression.type === 'Function') {
    patcher.overwrite(node.key.range[1], node.expression.range[0], '');
  } else if (isShorthandThisObjectMember(node)) {
    // `{ @a }` -> `{ a: @a }`
    patcher.insert(node.range[0], `${node.key.data}: `);
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchObjectEnd(node, patcher) {
  if (node.type === 'ObjectInitialiser') {
    if (!isCall(node.parentNode)) {
      if (patcher.original[node.range[0]] !== '{') {
        patcher.insert(node.range[1], isObjectAsStatement(node) ? '})' : '}');
      } else if (isObjectAsStatement(node)) {
        patcher.insert(node.range[1], ')');
      }
    } else {
      if (node !== node.parentNode.arguments[node.parentNode.arguments.length - 1]) {
        // Not the last argument, which is handled by `patchCalls`, so we handle it.
        if (isImplicitObject(node, patcher.original)) {
          patcher.insert(node.range[1], '}');
        }
      }
    }
  }
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function isObjectAsStatement(node) {
  if (node.parentNode.type !== 'Block' && !isConsequentOrAlternate(node)) {
    return false;
  }

  return !isImplicitlyReturned(node);
}
