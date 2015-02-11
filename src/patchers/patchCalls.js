import getIndent from '../utils/getIndent';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Adds tokens necessary to open a function call.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchCallOpening(node, patcher) {
  if (node.type === 'FunctionApplication') {
    addTokensIfNeeded(patcher, node.function, node.arguments);
  } else if (node.type === 'NewOp') {
    addTokensIfNeeded(patcher, node.ctor, node.arguments);
  }

  /**
   * @param {MagicString} patcher
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokensIfNeeded(patcher, callee, callArguments) {
    if (!callHasParentheses(callee, patcher.original)) {
      addTokens(patcher, callee, callArguments);
    } else {
      const lastArgument = callArguments[callArguments.length - 1];
      if (isImplicitObject(lastArgument, patcher.original)) {
        addObjectBrace(patcher, lastArgument);
      }
    }
  }

  /**
   * Adds an opening object brace at the start of the given node.
   *
   * @param {MagicString} patcher
   * @param {Object} node
   */
  function addObjectBrace(patcher, node) {
    patcher.insert(node.range[0], '{');
  }

  /**
   * Adds an opening parenthesis and, if necessary, an object brace.
   *
   * @param {MagicString} patcher
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokens(patcher, callee, callArguments) {
    if (callArguments.length === 0) {
      patcher.insert(callee.range[1], '(');
    } else {
      const firstArgument = callArguments[0];
      const lastArgument = callArguments[callArguments.length - 1];

      if (callee.line === lastArgument.line) {
        patcher.replace(
          callee.range[1],
          firstArgument.range[0],
          isImplicitObject(firstArgument, patcher.original) ? '({' : '('
        );
      } else {
        patcher.insert(
          callee.range[1],
          isImplicitObject(firstArgument, patcher.original) ? '({' : '('
        );
      }
    }
  }
}

/**
 * Adds tokens necessary to close the given function call.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchCallClosing(node, patcher) {
  if (node.type === 'FunctionApplication') {
    addTokensIfNeeded(patcher, node.function, node.arguments);
  } else if (node.type === 'NewOp') {
    addTokensIfNeeded(patcher, node.ctor, node.arguments);
  }

  /**
   * @param {MagicString} patcher
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokensIfNeeded(patcher, callee, callArguments) {
    if (!callHasParentheses(callee, patcher.original)) {
      addTokens(patcher, callee, callArguments);
    } else {
      const lastArgument = callArguments[callArguments.length - 1];
      if (isImplicitObject(lastArgument, patcher.original)) {
        addObjectBrace(patcher, lastArgument);
      }
    }
  }

  /**
   * @param {MagicString} patcher
   * @param {Object} node
   */
  function addObjectBrace(patcher, node) {
    patcher.insert(trimmedNodeRange(node, patcher.original)[1], '}');
  }

  /**
   * Adds a closing parenthesis and, if necessary, an object brace.
   *
   * @param {MagicString} patcher
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokens(patcher, callee, callArguments) {
    if (callArguments.length === 0) {
      patcher.insert(callee.range[1], ')');
    } else {
      const lastArgument = callArguments[callArguments.length - 1];
      const lastArgumentRange = trimmedNodeRange(lastArgument, patcher.original);

      if (callee.line === lastArgument.line) {
        patcher.insert(
          lastArgumentRange[1],
          isImplicitObject(lastArgument, patcher.original) ? '})' : ')'
        );
      } else {
        const indent = getIndent(patcher.original, callee.range[1]);
        patcher.insert(
          lastArgumentRange[1],
          isImplicitObject(lastArgument, patcher.original) ? `\n${indent}})` : `\n${indent})`
        );
      }
    }
  }
}

/**
 * @param {Object} callee
 * @param {string} source
 * @returns {boolean}
 */
function callHasParentheses(callee, source) {
  return source[callee.range[1]] === '(';
}

/**
 * @param {Object} node
 * @param {string} source
 * @returns {boolean}
 */
function isImplicitObject(node, source) {
  return node && node.type === 'ObjectInitialiser' && source[node.range[0]] !== '{';
}
