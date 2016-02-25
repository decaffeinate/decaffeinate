import escape, { escapeTemplateStringContents } from '../utils/escape.js';
import isMultiline from '../utils/isMultiline.js';
import { getIndentInfo, sharedIndentSize } from '../utils/stripSharedIndent.js';

const TRIPLE_QUOTE_LENGTH = 3;

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function replaceTripleQuotes(node, patcher) {
  let [start, end] = node.range;
  let contentStart = start + TRIPLE_QUOTE_LENGTH;
  let contentEnd = end - TRIPLE_QUOTE_LENGTH;
  let source = patcher.original;
  let quoteCharacter;

  if (node.type === 'TemplateLiteral' || isMultiline(source, node)) {
    let indents = getIndentInfo(source, contentStart, contentEnd);
    let indentSize = sharedIndentSize(indents.ranges);
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
    );
  }
}
