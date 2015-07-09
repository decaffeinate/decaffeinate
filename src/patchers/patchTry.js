import getIndent from '../utils/getIndent';
import lastIndexOfIgnoringComments from '../utils/lastIndexOfIgnoringComments';

/**
 * Adds punctuation to `try` statements.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchTryStart(node, patcher) {
  if (node.type === 'Try') {
    patcher.insert(node.range[0] + 'try'.length, ' {');
  } else if (node.parentNode && node.parentNode.type === 'Try') {
    if (node.parentNode.catchAssignee === node) {
      patcher.insert(node.range[0], '(');
      patcher.insert(node.range[1], ') {');
    } else if (node.parentNode.finallyBody === node) {
      let finallyIndex = lastIndexOfIgnoringComments(
        patcher.original,
        'finally',
        node.parentNode.finallyBody.range[0] - 1
      );
      patcher.insert(finallyIndex + 'finally'.length, ' {');
    }
  }
}

/**
 * Adds punctuation to `try` statements.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchTryEnd(node, patcher) {
  if (node.type === 'Try') {
    patcher.insert(node.range[1], `\n${getIndent(patcher.original, node.range[0])}}`);
  } else if (node.parentNode && node.parentNode.type === 'Try') {
    if (node.parentNode.body === node) {
      let closeBraceIndex;
      let source = patcher.original;
      if (node.parentNode.catchAssignee) {
        closeBraceIndex = lastIndexOfIgnoringComments(
          source,
          'catch',
          node.parentNode.catchAssignee.range[0] - 1
        );
      } else {
        closeBraceIndex = lastIndexOfIgnoringComments(
          source,
          'finally',
          node.parentNode.finallyBody.range[0] - 1
        );
      }
      patcher.insert(closeBraceIndex, '} ');
    }
  }
}
