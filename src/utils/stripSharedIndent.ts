import getIndent from './getIndent';

/**
 * Remove indentation shared by all lines and remove leading and trailing
 * newlines.
 */
export default function stripSharedIndent(source: string): string {
  let lines = source.split('\n');
  const commonIndent = getCommonIndent(lines);
  lines = lines.map((line) => {
    if (line.startsWith(commonIndent)) {
      return line.substr(commonIndent.length);
    }
    if (/^\s*$/.test(line)) {
      return '';
    }
    return line;
  });
  while (lines.length > 0 && lines[0].length === 0) {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].length === 0) {
    lines.pop();
  }
  return lines.join('\n');
}

function getCommonIndent(lines: Array<string>): string {
  let commonIndent: string | null = null;
  for (const line of lines) {
    const indent = getIndent(line, 0);
    if (indent === line) {
      continue;
    }
    if (commonIndent === null) {
      commonIndent = indent;
    } else {
      for (let i = 0; i < commonIndent.length; i++) {
        if (i >= indent.length || indent[i] !== commonIndent[i]) {
          commonIndent = commonIndent.substr(0, i);
          break;
        }
      }
    }
  }
  return commonIndent === null ? '' : commonIndent;
}
