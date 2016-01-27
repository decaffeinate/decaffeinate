import lex, { NORMAL, COMMENT } from './lex';

/**
 * Gets the range of the node by trimming whitespace and comments off the end.
 * CoffeeScriptRedux parses nodes by consuming up until the start of the next
 * node, so any whitespace or comments following a node end up as part of its
 * range. This tries to remove those trailing whitespace and comments.
 *
 * @param {Object} node
 * @param {string} source
 * @returns {number[]}
 */
export default function trimmedNodeRange(node, source) {
  const { range } = node;
  let state;
  let previousState;
  let index = range[0];
  let end;
  let step = lex(source, range[0]);

  while (index < range[1]) {
    ({ index, state, previousState } = step());

    if (state === NORMAL && previousState !== COMMENT && !/^\s$/.test(source[index - 1])) {
      end = index;
    }
  }

  return [range[0], end];
}
