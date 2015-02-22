/**
 * Replaces existential operators with a defined check.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchExistentialOperator(node, patcher) {
  if (node.type === 'UnaryExistsOp') {
    const expression = node.expression;
    if (expression.type === 'Identifier') {
      const checked = expression.data;
      patcher.replace(
        node.range[0],
        node.range[1],
        `typeof ${checked} !== "undefined" && ${checked} !== null`
      );
    } else {
      patcher.replace(node.range[1] - 1, node.range[1], ` != null`);
    }
  }
}
