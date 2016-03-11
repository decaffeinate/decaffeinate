import printTable from './printTable.js';
import repeat from 'repeating';
import type { ParseContext } from '../patchers/types.js';

export default class PatchError extends Error {
  constructor(message: string, context: ParseContext, start: number, end: number) {
    super(message);
    this.message = message;
    this.context = context;
    this.start = start;
    this.end = end;
  }

  toString(): string {
    return this.message;
  }

  static isA(error: Object): boolean {
    return 'context' in error && 'start' in error && 'end' in error;
  }

  static prettyPrint(error: PatchError) {
    let { context: { source, lineMap }, start, end, message } = error;
    let startLoc = lineMap.invert(start);
    let endLoc = lineMap.invert(end);

    let displayStartLine = Math.max(0, startLoc.line - 2);
    let displayEndLine = endLoc.line + 2;

    let rows = [];

    for (let line = displayStartLine; line <= displayEndLine; line++) {
      let startOfLine = lineMap(line, 0);
      let endOfLine = lineMap(line + 1, 0);
      if (isNaN(startOfLine)) {
        if (isNaN(endOfLine)) {
          break;
        } else {
          endOfLine = source.length;
        }
      }
      let lineSource = trimRight(source.slice(startOfLine, endOfLine));
      if (startLoc.line !== endLoc.line) {
        if (line >= startLoc.line && line <= endLoc.line) {
          rows.push(
            [`>`, `${line + 1} |`, lineSource]
          );
        } else {
          rows.push(
            [``, `${line + 1} |`, lineSource]
          );
        }
      } else if (line === startLoc.line) {
        rows.push(
          [`>`, `${line + 1} |`, lineSource],
          [``, `|`, repeat(' ', startLoc.column) + repeat('^', endLoc.column - startLoc.column)]
        );
      } else {
        rows.push(
          [``, `${line + 1} |`, lineSource]
        );
      }
    }

    let columns = [
      { id: 'marker', align: 'right' },
      { id: 'line', align: 'right' },
      { id: 'source', align: 'left' }
    ];

    return `${message}\n${printTable({ rows, columns })}`;
  }
}

function trimRight(string: string): string {
  return string.replace(/\s+$/, '');
}
