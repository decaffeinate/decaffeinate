import escape, { escapeTemplateStringContents } from '../utils/escape';
import isMultiline from '../utils/isMultiline';
import { getIndentInfo, sharedIndentSize } from '../utils/stripSharedIndent';

const TRIPLE_QUOTE_LENGTH = 3;

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function replaceTripleQuotes(node, patcher) {
  const [start, end] = node.range;
  const contentStart = start + TRIPLE_QUOTE_LENGTH;
  const contentEnd = end - TRIPLE_QUOTE_LENGTH;
  const source = patcher.original;
  let quoteCharacter;

  if (node.type === 'ConcatOp' || isMultiline(source, node)) {
    const indents = getIndentInfo(source, contentStart, contentEnd);
    const indentSize = sharedIndentSize(indents.ranges);
    indents.ranges.forEach(([start, end]) => {
      if (end - start >= indentSize) {
        patcher.remove(start, start + indentSize);
      }
    });
    patcher
      .remove(
        contentStart,
        contentStart + indents.leadingMargin
      )
      .remove(
        contentEnd - indents.trailingMargin,
        contentEnd
      )
      .overwrite(
        start,
        contentStart,
        '`'
      )
      .overwrite(
        contentEnd,
        end,
        '`'
      );
    escapeTemplateStringContents(
      patcher,
      contentStart,
      contentEnd
    );
  } else {
    quoteCharacter = patcher.original[start];
    patcher.remove(start, contentStart - quoteCharacter.length);
    patcher.remove(contentEnd + quoteCharacter.length, end);
    escape(
      patcher,
      [quoteCharacter],
      contentStart,
      contentEnd
    )
  }
}
