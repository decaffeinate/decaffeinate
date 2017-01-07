/**
 * Finds the start of the line for the character at offset.
 */
export default function getStartOfLine(source: string, offset: number): number {
  let lfIndex = source.lastIndexOf('\n', offset - 1);
  if (lfIndex < 0) {
    return 0;
  }
  return lfIndex + 1;
}
