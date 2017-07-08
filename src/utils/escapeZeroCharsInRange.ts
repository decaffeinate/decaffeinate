import NodePatcher from '../patchers/NodePatcher';

export default function escapeZeroCharsInRange(start: number, end: number, patcher: NodePatcher): void {
  let numBackslashes = 0;
  for (let i = start; i < end; i++) {
    if (patcher.context.source[i] === '\\') {
      numBackslashes++;
      continue;
    } else if (patcher.context.source[i] === '0' && numBackslashes % 2 === 1) {
      patcher.overwrite(i, i + 1, 'x00');
    }
    numBackslashes = 0;
  }
}
