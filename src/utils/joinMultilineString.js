/**
 * multi-line strings in coffeescript are joined together replacing each
 * new with a space. Replace all new lines and remove any indentation.
 *
 */
export default function joinMultilineString(patcher, characters, start) {
      let offset = 0;
      let end = 0;
      //let tripleQuoted = patcher.startsWith('\'\'\'') || patcher.startsWith('"""');
      while (characters.indexOf('\n', offset) >= 0) {
          let newLinePosition = characters.indexOf('\n', offset);
          if (newLinePosition >= 0) {
              end = nextNonWhiteSpaceChar(characters, newLinePosition + 1);
              //if (tripleQuoted) {
              //    patcher.remove(start + newLinePosition, start + end);
              //    patcher.insert(start + newLinePosition, '\\n');
              //} else {
              //    patcher.remove(start + newLinePosition, start + (end - 1));
              //}
              patcher.remove(start + newLinePosition, start + (end - 1));

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
        if (characters[i] != ' ') {
            return i;
        }
    }
    return start;
}
