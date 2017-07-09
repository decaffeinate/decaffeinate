import { StageResult } from '../../index';

const VALID_INDENTATIONS = ['    ', '   \t', '  \t', ' \t', '\t'];

/**
 * Convert Literate CoffeeScript into regular CoffeeScript.
 */
export default class LiterateStage {
  static run(content: string): StageResult {
    return {
      code: convertCodeFromLiterate(content),
      suggestions: [],
    };
  }
}

/**
 * Every line is either indented, unindented, or empty. A code section starts
 * when there is an empty line (or the start of the program) followed by an
 * indented line. A code section ends when there is an unindented line.
 *
 * This should match the behavior of helpers.invertLiterate in CoffeeScript,
 * while also forming the result into nice-looking comment blocks.
 */
function convertCodeFromLiterate(code: string): string {
  let lines = code.split('\n');
  let resultLines = [];

  // null if we're in a code section; otherwise the comment lines so far for the
  // current comment.
  let commentLines = null;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (commentLines === null) {
      if (lineIsEmpty(line) || lineIsIndented(line)) {
        resultLines.push(removeIndentation(line));
      } else {
        commentLines = [line];
      }
    } else {
      // Remain a comment on an empty line, an unindented line, or if the last
      // line was nonempty.
      if (lineIsEmpty(line) || !lineIsIndented(line) ||
          (i > 0 && !lineIsEmpty(lines[i - 1]))) {
        commentLines.push(line);
      } else {
        resultLines.push(...convertCommentLines(commentLines));
        commentLines = null;
        resultLines.push(removeIndentation(line));
      }
    }
  }
  resultLines.push(...convertCommentLines(commentLines));
  return resultLines.join('\n');
}

/**
 * Format a comment from an array of lines, including all trailing whitespace
 * lines. All comments become normal // comments in JS, since block comments are
 * treated specially by the CoffeeScript parser and can cause trouble if they
 * are introduced at the wrong indentation level.
 *
 * All blank lines between the comment lines and the following code are removed,
 * which generally matches JS comment style.
 */
function convertCommentLines(commentLines: Array<string> | null): Array<string> {
  if (commentLines === null) {
    return [];
  }
  commentLines = commentLines.slice();
  while (commentLines.length > 0 && lineIsEmpty(commentLines[commentLines.length - 1])) {
    commentLines.pop();
  }
  return commentLines.map(line => `# ${line}`);
}

function lineIsEmpty(line: string): boolean {
  return /^\s*$/.test(line);
}

function lineIsIndented(line: string): boolean {
  return VALID_INDENTATIONS.some(indent => line.startsWith(indent));
}

function removeIndentation(line: string): string {
  for (let indent of VALID_INDENTATIONS) {
    if (line.startsWith(indent)) {
      return line.slice(indent.length);
    }
  }
  if (lineIsEmpty(line)) {
    return line;
  }
  throw new Error('Unexpectedly removed indentation from an unindented line.');
}
