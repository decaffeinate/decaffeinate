/* @flow */

/**
 * Finds the start of the line for the character at offset.
 */
export default function getStartOfLine(source: string, offset: number): number {
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
