import sourceBetween from '../utils/sourceBetween';

/**
 * Patches sequences by replacing the character used to align with JavaScript.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSequences(node, patcher) {
  if (node.type === 'SeqOp') {
    const between = sourceBetween(patcher.original, node.left, node.right);
    const sequenceCharacterIndex = between.indexOf(';');
    patcher.overwrite(
      node.left.range[1] + sequenceCharacterIndex,
      node.left.range[1] + sequenceCharacterIndex + ';'.length,
      ','
    );
  }
}
