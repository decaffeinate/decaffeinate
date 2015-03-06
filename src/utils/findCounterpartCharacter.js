/**
 * Finds the counterpart character index to balance out the character at index.
 *
 * @example
 *
 *   findCounterpartCharacter('(', '((a) -> a(1, 2))', 0) // 15
 *
 * @param {string} character
 * @param {string} source
 * @param {number} index
 * @returns {number}
 */
export default function findCounterpartCharacter(character, source, index=0) {
  const counterpart = getCounterpart(character);
  const length = source.length;

  for (let level = 0; index < length; index++) {
    switch (source[index]) {
      case counterpart:
        level--;
        if (level === 0) {
          return index;
        }
        break;

      case character:
        level++;
        break;
    }
  }

  return -1;
}

/**
 * @param {string} character
 * @returns {string}
 */
function getCounterpart(character) {
  switch (character) {
    case '(':
      return ')';

    case '{':
      return '}';

    case '[':
      return ']';

    default:
      throw new Error('No known counterpart for character: ' + character);
  }
}
