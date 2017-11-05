/**
 * Given a list item (i.e. one element of an array literal, object literal,
 * function invocation, etc), run some normalize steps to simplify this type of
 * syntax in the normalize stage.
 */
import { SourceType } from 'coffee-lex';
import { Block } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../patchers/NodePatcher';
import containsDescendant from './containsDescendant';
import notNull from './notNull';

export default function normalizeListItem(
    patcher: NodePatcher, listItemPatcher: NodePatcher,
    nextListItemPatcher: NodePatcher | null): void {
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
  let nextToken = listItemPatcher.nextSemanticToken();
  if (nextToken && nextToken.type === SourceType.SEMICOLON &&
      nextToken.end <= patcher.contentEnd) {
    if (patcherEndsInStatement(listItemPatcher)) {
      patcher.remove(nextToken.start, nextToken.end);
    } else {
      patcher.overwrite(nextToken.start, nextToken.end, ',');
    }
  }

  if (nextListItemPatcher) {
    // We have two adjacent items, so do some cleanups based on the tokens
    // between them (comma tokens, or technically semicolons are treated as
    // commas as well).
    let commaTokens = patcher.getProgramSourceTokens()
      .slice(notNull(listItemPatcher.outerEndTokenIndex.next()), nextListItemPatcher.outerStartTokenIndex)
      .filter(token => token.type === SourceType.COMMA || token.type === SourceType.SEMICOLON)
      .toArray();

    // Sometimes other normalize steps can cause two adjacent list items to be
    // reinterpreted as a function call, so put a comma in between them to stop
    // that, but avoid other cases where adding a comma would cause a crash.
    if (nextListItemPatcher.node.type === 'ObjectInitialiser' &&
        !isNestedListItem(listItemPatcher) &&
        commaTokens.length === 0) {
      patcher.insert(listItemPatcher.outerEnd, ',');
    }
  }
}

/**
 * Determine if this node might end in an "unclosed" block. If so, then in some
 * cases, it's not allowed to put a comma at the end of this node, since doing
 * so could cause a parser crash.
 */
function isNestedListItem(patcher: NodePatcher): boolean {
  return [
    'BoundFunction',
    'BoundGeneratorFunction',
    'Conditional',
    'ForIn',
    'ForOf',
    'Function',
    'GeneratorFunction',
    'Switch',
    'Try',
    'While',
  ].indexOf(patcher.node.type) > -1;
}

/**
 * Determine if the given list item ends with a statement. If so, and it's
 * followed by a semicolon, then the semicolon should be seen as part of the
 * statement. The CoffeeScript lexer ignores semicolon tokens early on, so
 * they're not included in the normal statement bounds.
 */
function patcherEndsInStatement(patcher: NodePatcher): boolean {
  return containsDescendant(patcher.node, child =>
    child instanceof Block && child.end === patcher.contentEnd
  );
}
