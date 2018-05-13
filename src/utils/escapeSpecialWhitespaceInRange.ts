import NodePatcher from '../patchers/NodePatcher';

function isAlreadyEscaped(i: number, start: number, patcher: NodePatcher): boolean {
  let numLeadingBackslashes = 0;
  while (i - numLeadingBackslashes - 1 >= start && patcher.context.source[i - numLeadingBackslashes - 1] === '\\') {
    numLeadingBackslashes++;
  }
  return numLeadingBackslashes % 2 === 1;
}

export default function escapeSpecialWhitespaceInRange(start: number, end: number, patcher: NodePatcher): void {
  for (let i = start; i < end; i++) {
    let unicodeSequence = null;
    if (patcher.context.source[i] === '\u2028') {
      unicodeSequence = 'u2028';
    } else if (patcher.context.source[i] === '\u2029') {
      unicodeSequence = 'u2029';
    } else {
      continue;
    }

    if (isAlreadyEscaped(i, start, patcher)) {
      patcher.overwrite(i, i + 1, unicodeSequence);
    } else {
      patcher.overwrite(i, i + 1, `\\${unicodeSequence}`);
    }
  }
}
