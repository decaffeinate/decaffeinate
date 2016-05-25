/**
 * Inserts string escape characters before certain characters to be escaped.
 *
 * @param {MagicString} patcher
 * @param {string[]|function(string): boolean} characters
 * @param {number} start
 * @param {number} end
 */
export default function escape(patcher, characters, start, end) {
  let source = patcher.original;
  let predicate = typeof characters !== 'function' ?
    (chr => characters.indexOf(chr) >= 0) :
    characters;
  for (let i = start; i < end; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (predicate(source[i], i, source)) {
      patcher.insertRight(i, '\\');
    }
  }
}

/**
 * Escape characters to be within a template string, i.e. ` and $ before {.
 *
 * @param {MagicString} patcher
 * @param {number} start
 * @param {number} end
 */
export function escapeTemplateStringContents(patcher, start, end) {
  escape(
    patcher,
    (chr, i, source) => chr === '`' || (chr === '$' && source[i + 1] === '{'),
    start,
    end
  );
}
