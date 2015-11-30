import escape from '../utils/escape';
import isMultiline from '../utils/isMultiline';
import { getIndentInfo, sharedIndentSize } from '../utils/stripSharedIndent';

const TRIPLE_DOUBLE_QUOTE = '"""';
const TRIPLE_SINGLE_QUOTE = "'''";
const TRIPLE_QUOTE_LENGTH = 3;

/**
 * Replaces multi-quote strings with one-quote strings or template strings.
 *
 * @example
 *
 *   """abc"""  ->  "abc"
 *   '''abc'''  ->  'abc'
 *
 *   '''ab      ->  `ab
 *   c'''           c`
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchString(node, patcher) {
  if (node.type === 'String') {
    switch (node.raw.slice(0, TRIPLE_QUOTE_LENGTH)) {
      case TRIPLE_DOUBLE_QUOTE:
      case TRIPLE_SINGLE_QUOTE:
        replaceTripleQuotes(node, patcher);
        break;
    }
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
function replaceTripleQuotes(node, patcher) {
  const [start, end] = node.range;
  const contentStart = start + TRIPLE_QUOTE_LENGTH;
  const contentEnd = end - TRIPLE_QUOTE_LENGTH;
  const source = patcher.original;
  let quoteCharacter;

  if (isMultiline(source, node)) {
    quoteCharacter = '`';
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
        start + TRIPLE_QUOTE_LENGTH,
        '`'
      )
      .overwrite(
        end - TRIPLE_QUOTE_LENGTH,
        end,
        '`'
      );
  } else {
    quoteCharacter = patcher.original[start];
    patcher.remove(start, contentStart - quoteCharacter.length);
    patcher.remove(contentEnd + quoteCharacter.length, end);
  }

  escape(
    patcher,
    [quoteCharacter],
    start + TRIPLE_QUOTE_LENGTH,
    end - TRIPLE_QUOTE_LENGTH
  );
}
