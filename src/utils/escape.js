/* @flow */

import type MagicString from 'magic-string';

/**
 * Inserts string escape characters before certain characters/strings to be
 * escaped.
 */
export default function escape(patcher: MagicString, escapeStrings: Array<string>, start: number, end: number) {
  let source = patcher.original;
  for (let i = start; i < end; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (escapeStrings.some(str => source.slice(i, i + str.length) === str)) {
      patcher.appendRight(i, '\\');
    }
  }
}
