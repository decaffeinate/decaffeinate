/* @flow */

type StringInfo = {
  content: string;
  length: number;
  indent: ?number;
  start: number;
  end: number;
  textStart: ?number;
  textEnd: ?number;
  prev: ?StringInfo;
  next: ?StringInfo;
  empty: boolean;
  first: boolean;
  last: boolean;
};

/* parseMutlilineString takes a raw string as input and returns
 * an array of 'line' objects representing each line of the string.
 * These can then be used to patch a string ensuring the output
 * is identical to coffee script.
 */
export function parseMultilineString(string: string, offsetStart: number, quoteLen: number): Array<StringInfo> {
  let output = [];
  let offset = offsetStart + quoteLen;
  string = string.slice(quoteLen, string.length - quoteLen);

  for (let line of string.split('\n')) {
    let textStartOffset = getTextStartOffset(line);
    let textEndOffset = getTextEndOffset(line);
    let empty = textStartOffset === null && textEndOffset === null;

    output.push({
      content: line,
      length: line.length,
      indent: textStartOffset,
      start: offset,
      end: offset + line.length + 1,
      textStart: (textStartOffset === null) ? null : offset + textStartOffset,
      textEnd: (textEndOffset === null) ? null : offset + textEndOffset,
      prev: null,
      next: null,
      empty,
      first: false,
      last: false
    });
    offset = offset + line.length + '\n'.length;
  }

  for (let i = 0; i < output.length - 1; i++) {
    if (i > 0) {
      output[i].prev = output[i - 1];
    }
    if (i < output.length - 1) {
      output[i].next = output[i + 1];
    }
  }

  output[0].first = true;
  output[output.length -1].last = true;
  output[output.length -1].end = output[output.length -1].end - '\n'.length;
  return output;
}

/* return the offset within the string of the
 * first non white space character, returns
 * null if the string is 0 length or if the line
 * is all white space.
 */
function getTextStartOffset(line: string): ?number {
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== ' ') {
      return i;
    }
  }
  return null;
}

/* return the offset within the string of the last
 * non white space character, returns null if the
 * string is 0 length or if the line is all white
 * space.
 */
function getTextEndOffset(line: string): ?number {
  for (let i = line.length - 1; i >= 0; i--) {
    if (line[i] !== ' ') {
      return i;
    }
  }
  return null;
}
