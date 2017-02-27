import { SourceType } from 'coffee-lex';

import type NodePatcher from '../patchers/NodePatcher';

/**
 * Given a list item (i.e. one element of an array literal, object literal,
 * function invocation, etc), run some normalize steps to simplify this type of
 * syntax in the normalize stage.
 */
export default function normalizeListItem(patcher: NodePatcher, listItemPatcher: NodePatcher) {
  // If the last token of the arg is a comma, then the actual delimiter must
  // be a newline and the comma is unnecessary and can cause a syntax error
  // when combined with other normalize stage transformations. So just
  // remove the redundant comma.
  let lastToken = listItemPatcher.lastToken();
  if (lastToken.type === SourceType.COMMA) {
    patcher.remove(lastToken.start, lastToken.end);
  }
  // CoffeeScript allows semicolon-separated lists, so just change them to
  // commas if we see them.
  let nextToken = listItemPatcher.nextToken();
  if (nextToken && nextToken.type === SourceType.SEMICOLON && nextToken.end <= patcher.contentEnd) {
    patcher.overwrite(nextToken.start, nextToken.end, ',');
  }
}
