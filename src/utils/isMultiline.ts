import { Node } from 'decaffeinate-parser/dist/nodes';

/**
 * Determines whether the given node spans multiple lines.
 */
export default function isMultiline(source: string, node: Node): boolean {
  const newlineIndex = source.indexOf('\n', node.start);
  return newlineIndex >= 0 && newlineIndex < node.end;
}
