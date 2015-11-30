import escape from '../utils/escape';
import isMultiline from '../utils/isMultiline';
import { indentRanges, sharedIndentSize } from '../utils/stripSharedIndent';

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
  const source = patcher.original;
  let quoteCharacter;

  if (isMultiline(source, node)) {
    quoteCharacter = '`';
    if (source[start + TRIPLE_QUOTE_LENGTH] === '\n') {
      patcher.remove(
        start + TRIPLE_QUOTE_LENGTH,
        start + TRIPLE_QUOTE_LENGTH + '\n'.length
      );
    }
    const ranges = indentRanges(source, start + TRIPLE_QUOTE_LENGTH, end - TRIPLE_QUOTE_LENGTH);
    const indentSize = sharedIndentSize(ranges);
    ranges.forEach(([start, end]) => {
      if (end - start >= indentSize) {
        patcher.remove(start, start + indentSize);
      }
    });
    if (source[end - TRIPLE_QUOTE_LENGTH - '\n'.length] === '\n') {
      patcher.remove(
        end - TRIPLE_QUOTE_LENGTH - '\n'.length,
        end - TRIPLE_QUOTE_LENGTH
      );
    }
    patcher.overwrite(start, start + TRIPLE_QUOTE_LENGTH, '`');
    patcher.overwrite(end - TRIPLE_QUOTE_LENGTH, end, '`');
  } else {
    quoteCharacter = patcher.original[start];
    patcher.remove(start, start + TRIPLE_QUOTE_LENGTH - 1);
    patcher.remove(end - TRIPLE_QUOTE_LENGTH + 1, end);
  }

  escape(
    patcher,
    [quoteCharacter],
    start + TRIPLE_QUOTE_LENGTH,
    end - TRIPLE_QUOTE_LENGTH
  );
}
