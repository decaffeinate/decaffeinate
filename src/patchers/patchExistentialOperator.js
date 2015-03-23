/**
 * Replaces existential operators with a defined check.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchExistentialOperator(node, patcher) {
  if (node.type === 'UnaryExistsOp') {
    const expression = node.expression;
    const parens = needsParens(node);
    if (expression.type === 'Identifier') {
      const checked = expression.data;
      let replacement = `typeof ${checked} !== "undefined" && ${checked} !== null`;
      if (parens) {
        replacement = `(${replacement})`;
      }
      patcher.replace(node.range[0], node.range[1], replacement);
    } else {
      let replacement = ` != null`;
      if (parens) {
        patcher.insert(node.range[0], '(');
        replacement += ')';
      }
      patcher.replace(node.range[1] - 1, node.range[1], replacement);
    }
  }
}

/**
 * Determines whether the given node needs parentheses.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function needsParens(node) {
  return node.parent.type !== 'Block';
}
