import isImplicitObject from '../utils/isImplicitObject';
import isImplicitlyReturned from '../utils/isImplicitlyReturned';
import { isConsequentOrAlternate } from '../utils/types';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchObjectBraceOpening(node, patcher) {
  if (node.type === 'ObjectInitialiser') {
    if (node.parentNode.type !== 'FunctionApplication') {
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
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchObjectBraceClosing(node, patcher) {
  if (node.type === 'ObjectInitialiser') {
    if (node.parentNode.type !== 'FunctionApplication') {
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
