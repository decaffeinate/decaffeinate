import getFreeBinding from '../utils/getFreeBinding';
import getIndent from '../utils/getIndent';
import indexOfIgnoringComments from '../utils/indexOfIgnoringComments';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isMultiline from '../utils/isMultiline';
import makeIIFE from '../utils/makeIIFE';
import sourceBetween from '../utils/sourceBetween';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Rewrites `try` expressions by wrapping them in an IIFE. Ensures catch
 * exists with an error assignee if needed.
 *
 * @example
 *
 *   (try a)(b) # => (=> try a catch _error)(b)
 *
 *   try
 *     a
 *   catch # => catch _error
 *     b
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @returns {boolean}
 */
export default function preprocessTry(node, patcher) {
  if (node.type === 'Try') {
    if (isExpressionResultUsed(node)) {
      makeIIFE(node, patcher);
      return true;
    }

    if (!node.catchAssignee) {
      if (node.catchBody) {
        let nodeBeforeCatchClause = node.body;
        let nodeAfterCatchClause = node.catchBody;
        let source = sourceBetween(patcher.original, nodeBeforeCatchClause, nodeAfterCatchClause);
        let catchIndex = indexOfIgnoringComments(source, 'catch');
        if (catchIndex === -1) {
          throw new Error(
            `unable to find catch between try block body ` +
            `(${nodeBeforeCatchClause.line}:${nodeBeforeCatchClause.column}) and catch body ` +
            `(${nodeAfterCatchClause.line}:${nodeAfterCatchClause.column})`
          );
        }
        patcher.insert(
          nodeBeforeCatchClause.range[1] + catchIndex + 'catch'.length,
          ` ${getFreeBinding(node.scope, '_error')}`
        );
        return true;
      } else if (!node.finallyBody) {
        if (node.body.type === 'Block') {
          patcher.insert(
            trimmedNodeRange(node.body, patcher.original)[1],
            `\n${getIndent(patcher.original, node.range[0])}catch ${getFreeBinding(node.scope, '_error')}`
          );
          return true;
        } else if (!isMultiline(patcher.original, node)) {
          patcher.insert(trimmedNodeRange(node, patcher.original)[1], ` catch ${getFreeBinding(node.scope, '_error')}`);
          return true;
        }
      }
    }
  }
}
