/**
 * Patches sequences by replacing the character used to align with JavaScript.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchSequences(node, patcher) {
  if (node.type === 'SeqOp') {
    const sourceBetween = patcher.slice(node.left.range[1], node.right.range[0]);
    const sequenceCharacterIndex = sourceBetween.indexOf(';');
    patcher.replace(
      node.left.range[1] + sequenceCharacterIndex,
      node.left.range[1] + sequenceCharacterIndex + ';'.length,
      ','
    );
  }
}
