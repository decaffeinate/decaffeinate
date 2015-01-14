/**
 * Inserts parentheses on function calls.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
function patchCallParens(node, patcher) {
  const source = patcher.original;

  if (node.type === 'FunctionApplication') {
    if (node.raw.indexOf('\n') < 0) {
      if (source[node.function.range[1]] !== '(') {
        patcher.replace(node.function.range[1], node.arguments[0].range[0], '(');
        patcher.insert(node.arguments[node.arguments.length - 1].range[1], ')');
      }
    }
  } else if (node.type === 'NewOp') {
    if (node.raw.indexOf('\n') < 0) {
      const calleeEnd = node.ctor.range[1];
      if (source[calleeEnd] !== '(') {
        if (node.arguments.length > 0) {
          patcher.replace(calleeEnd, node.arguments[0].range[0], '(');
          patcher.insert(node.arguments[node.arguments.length - 1].range[1], ')');
        } else {
          patcher.insert(calleeEnd, '()');
        }
      }
    }
  }
}
exports.patchCallParens = patchCallParens;
