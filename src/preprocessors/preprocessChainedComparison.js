import getFreeBinding from '../utils/getFreeBinding';
import isSafeToRepeat from '../utils/isSafeToRepeat';

/**
 * Expands chained comparisons, i.e. `a < b < c` to `a < b && b < c`.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function preprocessChainedComparison(node, patcher) {
  if (node.type === 'ChainedComparisonOp') {
    const middle = node.expression.left.right;
    if (isSafeToRepeat(middle)) {
      patcher.insert(middle.range[1], ` && ${middle.raw}`);
    } else {
      const temp = getFreeBinding(node.scope);
      patcher.overwrite(middle.range[0], middle.range[1], `(${temp} = ${middle.raw}) && ${temp}`);
    }
    return true;
  }
}
