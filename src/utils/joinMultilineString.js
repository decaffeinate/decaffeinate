/**
 * multi-line strings in coffeescript are joined together replacing each
 * new with a space. Replace all new lines and remove any indentation.
 *
 */
export default function joinMultilineString(patcher, characters, start) {
      let offset = 0;
      let end = 0;
      let tripleQuoted = patcher.startsWith('\'\'\'') || patcher.startsWith('"""');
      while (characters.indexOf('\n', offset) >= 0) {
          let newLinePosition = characters.indexOf('\n', offset);
          if (newLinePosition >= 0) {
              end = nextNonWhiteSpaceChar(characters, newLinePosition + 1);
              if (tripleQuoted) {
                patcher.remove(start + newLinePosition + 1, start + end);
              } else {
                if (newLinePosition != (end - 1)) {
                    end = end - 1;
                }
                patcher.remove(start + newLinePosition, start + end);
              }
          }
          offset = newLinePosition + 1;
       }
}

/**
 * locate the next non-whitespace character from 'start', used to help
 * remove indentation.
 */
function nextNonWhiteSpaceChar(characters, start) {
    for (let i = start; i < characters.length; i++) {
        console.log('checking', i, characters[i]);
        if (characters[i] != ' ') {
            console.log('return', i);
            return i;
        }
    }
    console.log('found none', start);
    return start;
}
