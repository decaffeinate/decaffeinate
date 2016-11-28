/* @flow */

import type MagicString from 'magic-string';

/**
 * Inserts string escape characters before certain characters/strings to be
 * escaped.
 *
 * The skipPattern parameter describes which already-escaped characters to skip
 * over. For normal strings, if we see any backslash, we skip it and the next
 * character, but for heregexes, we only skip a backslash followed by
 * whitespace.
 */
export default function escape(patcher: MagicString, skipPattern: RegExp, escapeStrings: Array<string>, start: number, end: number) {
  let source = patcher.original;
  for (let i = start; i < end; i++) {
    if (skipPattern.test(source.slice(i))) {
      i++;
    } else if (escapeStrings.some(str => source.slice(i, i + str.length) === str)) {
      patcher.appendRight(i, '\\');
    }
  }
}
