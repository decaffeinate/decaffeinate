/**
 * Determine the most common newline string in the given code, either '\n' or
 * '\r\n'. Prefer '\n' in the case of a tie.
 */
export default function detectNewlineStr(source: string): string {
  let numLFs = 0;
  let numCRLFs = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n' && (i === 0 || source[i - 1] !== '\r')) {
      numLFs++;
    }
    if (source.slice(i, i + 2) === '\r\n') {
      numCRLFs++;
    }
  }
  return numCRLFs > numLFs ? '\r\n' : '\n';
}
