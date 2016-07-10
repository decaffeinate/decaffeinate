/* @flow */

/**
 * Gets the indent string for the line containing offset.
 */
export default function getIndent(source: string, offset: number): string {
  let startOfLine = getStartOfLine(source, offset);
  let indentOffset = startOfLine;
  let indentCharacter;

  switch (source[indentOffset]) {
    case ' ':
    case '\t':
      indentCharacter = source[indentOffset];
      break;

    default:
      return '';
  }

  while (source[indentOffset] === indentCharacter) {
    indentOffset++;
  }

  return source.slice(startOfLine, indentOffset);
}

/**
 * Finds the start of the line for the character at offset.
 */
function getStartOfLine(source: string, offset: number): number {
  let lfIndex = source.lastIndexOf('\n', offset - 1);

  if (lfIndex < 0) {
    let crIndex = source.lastIndexOf('\r', offset - 1);

    if (crIndex < 0) {
      return 0;
    }

    return crIndex + 1;
  }

  return lfIndex + 1;
}
