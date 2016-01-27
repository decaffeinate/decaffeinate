import getFreeBinding from '../utils/getFreeBinding';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';

/**
 * Re-writes soaked member expressions into CoffeeScript that does not use
 * soaked member expressions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessSoakedMemberAccessOp(node, patcher) {
  if (node.type === 'SoakedMemberAccessOp' || node.type === 'SoakedDynamicMemberAccessOp') {
    // For member access with identifier object:
    //
    // `a?.b()` -> `if a? then a.b()`
    //              ^^^  ^^^^^^^
    //
    // For member access with complex object:
    //
    // `a.b?.c` -> `if (ref = a.b)? then ref.c`
    //              ^^^^^^^^^^   ^ ^^^^^^^^^
    let { expression } = node;
    let conditional;
    if (node.parentNode.type === 'FunctionApplication' && node.parentNode.function === node) {
      conditional = node.parentNode;
    } else {
      conditional = node;
    }
    let parens = isExpressionResultUsed(conditional);
    let consequent;
    if (parens) {
      patcher.insert(conditional.range[0], '(');
    }
    patcher.insert(expression.range[0], 'if ');
    if (expression.type === 'Identifier') {
      consequent = ` then ${expression.raw}`;
    } else {
      let tmp = getFreeBinding(node.scope);
      patcher.insert(expression.range[0], `(${tmp} = `);
      patcher.insert(expression.range[1], `)`);
      consequent = ` then ${tmp}`;
    }
    patcher.insert(expression.range[1] + 1, consequent);
    if (parens) {
      patcher.insert(conditional.range[1], ')');
    }
    return true;
  }
}
