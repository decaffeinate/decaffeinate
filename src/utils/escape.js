/**
 * Inserts string escape characters before certain characters to be escaped.
 *
 * @param {MagicString} patcher
 * @param {string[]} characters
 * @param {number} start
 * @param {number} end
 */
export default function escape(patcher, characters, start, end) {
  const source = patcher.original;
  for (let i = start; i < end; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (characters.indexOf(source[i]) >= 0) {
      patcher.insert(i, '\\');
    }
  }
}
