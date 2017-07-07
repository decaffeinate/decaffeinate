import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { Node } from 'decaffeinate-parser/dist/nodes';

/**
 * Determines whether a node represents a function, i.e. `->` or `=>`.
 */
export function isFunction(node: Node, allowBound: boolean=true): boolean {
  return node.type === 'Function' || node.type === 'GeneratorFunction' ||
    (allowBound && (node.type === 'BoundFunction' || node.type === 'BoundGeneratorFunction'));
}

const NON_SEMANTIC_SOURCE_TOKEN_TYPES = [SourceType.COMMENT, SourceType.HERECOMMENT, SourceType.NEWLINE];

/**
 * This isn't a great name because newlines do have semantic meaning in
 * CoffeeScript, but it's close enough.
 */
export function isSemanticToken(token: SourceToken): boolean {
  return NON_SEMANTIC_SOURCE_TOKEN_TYPES.indexOf(token.type) < 0;
}
