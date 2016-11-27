/* @flow */

import type MagicString from 'magic-string';

/**
 * Inserts string escape characters before certain characters to be escaped.
 */
export default function escape(patcher: MagicString, characters: Array<string>|(char: string, index: number, source: string) => boolean, start: number, end: number) {
  let source = patcher.original;
  let predicate = typeof characters !== 'function' ?
    (chr => characters.indexOf(chr) >= 0) :
    characters;
  for (let i = start; i < end; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (predicate(source[i], i, source)) {
      patcher.appendRight(i, '\\');
    }
  }
}

/**
 * Escape characters to be within a template string, i.e. ` and $ before {.
 */
export function escapeTemplateStringContents(patcher: MagicString, start: number, end: number) {
  escape(
    patcher,
    (chr, i, source) => chr === '`' || (chr === '$' && source[i + 1] === '{'),
    start,
    end
  );
}
