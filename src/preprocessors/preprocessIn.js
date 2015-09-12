import getFreeBinding from '../utils/getFreeBinding';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import requiresParentheses from '../utils/requiresParentheses';

/**
 * Replace `in` infix operators with a call to `indexOf`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessIn(node, patcher) {
  if (node.type === 'InOp') {
    let indexable = node.right.raw;
    let element = node.left.raw;
    let needsParentheses = false;
    let prefix = '';

    if (node.left.type !== 'Identifier') {
      const temp = getFreeBinding(node.scope);
      needsParentheses = isExpressionResultUsed(node);
      prefix += `${temp} = ${element}; `;
      element = temp;
    }

    if (requiresParentheses(node.right)) {
      indexable = `(${indexable})`;
    }

    let isNegated = patcher.original.slice(node.left.range[1], node.right.range[0]).indexOf('not in') >= 0;
    let replacement = `${prefix}${indexable}.indexOf(${element}) ${isNegated ? '<' : '>='} 0`;

    if (needsParentheses) {
      replacement = `(${replacement})`;
    }

    patcher.overwrite(node.range[0], node.range[1], replacement);
    return true;
  }
}
