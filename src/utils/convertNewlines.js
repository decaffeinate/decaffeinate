/**
 * Convert the given code to use the specified newline string, either '\n' or
 * '\r\n'.
 *
 * @flow
 */
export default function convertNewlines(source: string, newlineStr: string): string {
  if (newlineStr === '\n') {
    return source.replace(/\r\n/g, '\n');
  } else if (newlineStr === '\r\n') {
    source = source.replace(/\r\n/g, '\n');
    return source.replace(/\n/g, '\r\n');
  } else {
    throw new Error(`Unexpected newling string to convert to: ${JSON.stringify(newlineStr)}`);
  }
}
