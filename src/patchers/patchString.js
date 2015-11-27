import escape from '../utils/escape';
import isMultiline from '../utils/isMultiline';

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
  const source = patcher.original;
  let quoteCharacter;

  if (isMultiline(source, node)) {
    quoteCharacter = '`';
    patcher.overwrite(node.range[0], node.range[0] + TRIPLE_QUOTE_LENGTH, '`');
    patcher.overwrite(node.range[1] - TRIPLE_QUOTE_LENGTH, node.range[1], '`');
  } else {
    quoteCharacter = patcher.original[node.range[0]];
    patcher.remove(node.range[0], node.range[0] + TRIPLE_QUOTE_LENGTH - 1);
    patcher.remove(node.range[1] - TRIPLE_QUOTE_LENGTH + 1, node.range[1]);
  }

  escape(
    patcher,
    [quoteCharacter],
    node.range[0] + TRIPLE_QUOTE_LENGTH,
    node.range[1] - TRIPLE_QUOTE_LENGTH
  );
}
