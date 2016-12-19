/* @flow */

import type { Node } from '../patchers/types';

/**
 * Determines whether the given node spans multiple lines.
 */
export default function isMultiline(source: string, node: Node): boolean {
  let newlineIndex = source.indexOf('\n', node.range[0]);
  return newlineIndex >= 0 && newlineIndex < node.range[1];
}
