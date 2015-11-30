import replaceTripleQuotes from '../utils/replaceTripleQuotes';

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
