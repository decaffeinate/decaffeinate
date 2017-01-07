import getStartOfLine from './getStartOfLine';

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
