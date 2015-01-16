/**
 * Inserts parentheses on function calls.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchCallParens(node, patcher) {
  if (node.type === 'FunctionApplication') {
    addParenthesesIfNeeded(patcher, node.function, node.arguments);
  } else if (node.type === 'NewOp') {
    addParenthesesIfNeeded(patcher, node.ctor, node.arguments);
  }
}

/**
 * @param {MagicString} patcher
 * @param {Object} callee
 * @param {Object[]} callArguments
 */
function addParenthesesIfNeeded(patcher, callee, callArguments) {
  if (patcher.original[callee.range[1]] !== '(') {
    addParentheses(patcher, callee, callArguments);
  }
}

/**
 * Adds parentheses after the callee and surrounding the arguments.
 *
 * @param {MagicString} patcher
 * @param {Object} callee
 * @param {Object[]} callArguments
 */
function addParentheses(patcher, callee, callArguments) {
  if (callArguments.length === 0) {
    patcher.insert(callee.range[1], '()');
  } else {
    const firstArgument = callArguments[0];
    const lastArgument = callArguments[callArguments.length - 1];

    if (callee.line === lastArgument.line) {
      patcher.replace(callee.range[1], firstArgument.range[0], '(');
      patcher.insert(lastArgument.range[1], ')');
    } else {
      patcher.replace(callee.range[1], firstArgument.range[0], '(\n');
      patcher.insert(lastArgument.range[1], '\n)');
    }
  }
}
