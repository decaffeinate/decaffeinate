import getIndent from '../utils/getIndent';
import rangeIncludingParentheses from '../utils/rangeIncludingParentheses';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Adds tokens necessary to open a function call.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchCallOpening(node, patcher) {
  if (node.type === 'FunctionApplication') {
    addTokensIfNeeded(node.function, node.arguments);
  } else if (node.type === 'NewOp') {
    addTokensIfNeeded(node.ctor, node.arguments);
  }

  /**
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokensIfNeeded(callee, callArguments) {
    if (!callHasParentheses(callee, patcher.original)) {
      addTokens(callee, callArguments);
    } else {
      const lastArgument = callArguments[callArguments.length - 1];
      if (isImplicitObject(lastArgument, patcher.original)) {
        addObjectBrace(lastArgument);
      }
    }
  }

  /**
   * Adds an opening object brace at the start of the given node.
   *
   * @param {Object} n
   */
  function addObjectBrace(n) {
    patcher.insert(n.range[0], '{');
  }

  /**
   * Adds an opening parenthesis and, if necessary, an object brace.
   *
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokens(callee, callArguments) {
    if (callArguments.length === 0) {
      patcher.insert(callee.range[1], '(');
    } else {
      const firstArgument = callArguments[0];
      const lastArgument = callArguments[callArguments.length - 1];

      if (callee.line === lastArgument.line) {
        patcher.overwrite(
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
    addTokensIfNeeded(node.function, node.arguments);
  } else if (node.type === 'NewOp') {
    addTokensIfNeeded(node.ctor, node.arguments);
  }

  /**
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokensIfNeeded(callee, callArguments) {
    if (!callHasParentheses(callee, patcher.original)) {
      addTokens(callee, callArguments);
    } else {
      const lastArgument = callArguments[callArguments.length - 1];
      if (isImplicitObject(lastArgument, patcher.original)) {
        addObjectBrace(lastArgument);
      }
    }
  }

  /**
   * @param {Object} n
   */
  function addObjectBrace(n) {
    patcher.insert(trimmedNodeRange(n, patcher.original)[1], '}');
  }

  /**
   * Adds a closing parenthesis and, if necessary, an object brace.
   *
   * @param {Object} callee
   * @param {Object[]} callArguments
   */
  function addTokens(callee, callArguments) {
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
  const calleeRangeIncludingParentheses = rangeIncludingParentheses(callee, source);
  return source[calleeRangeIncludingParentheses[1]] === '(';
}

/**
 * @param {Object} node
 * @param {string} source
 * @returns {boolean}
 */
function isImplicitObject(node, source) {
  return node && node.type === 'ObjectInitialiser' && source[node.range[0]] !== '{';
}
