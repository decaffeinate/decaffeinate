/**
 * Prepares the start of an existential operator node.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchExistentialOperatorStart(node, patcher) {
  if (node.type === 'UnaryExistsOp') {
    const { expression } = node;
    if (expression.type !== 'Identifier' && needsParens(node)) {
      patcher.insert(node.range[0], '(');
    }
  }
}

/**
 * Prepares the start of an existential operator node.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchExistentialOperatorEnd(node, patcher) {
  if (node.type === 'UnaryExistsOp') {
    const { expression } = node;
    const parens = needsParens(node);
    if (expression.type === 'Identifier') {
      const checked = expression.data;
      let replacement = `typeof ${checked} !== "undefined" && ${checked} !== null`;
      if (parens) {
        replacement = `(${replacement})`;
      }
      patcher.overwrite(node.range[0], node.range[1], replacement);
    } else {
      let replacement = ` != null`;
      if (parens) { replacement += ')'; }
      patcher.overwrite(node.range[1] - 1, node.range[1], replacement);
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
  return node.parentNode.type !== 'Block';
}
