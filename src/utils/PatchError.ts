import LinesAndColumns from 'lines-and-columns';
import printTable, { Column } from './printTable';

export default class PatchError extends Error {
  constructor(
    readonly message: string,
    readonly source: string,
    readonly start: number,
    readonly end: number,
  ) {
    super(message);
  }

  toString(): string {
    return this.message;
  }

  /**
   * Due to babel's inability to simulate extending native types, we have our
   * own method for determining whether an object is an instance of
   * `PatchError`.
   *
   * @see http://stackoverflow.com/a/33837088/549363
   */
  static detect(error: Error): boolean {
    return (
      error instanceof Error &&
      'source' in error &&
      'start' in error &&
      'end' in error
    );
  }

  static prettyPrint(error: PatchError): string {
    let { source, start, end, message } = error;
    start = Math.min(Math.max(start, 0), source.length);
    end = Math.min(Math.max(end, start), source.length);
    let lineMap = new LinesAndColumns(source);
    let startLoc = lineMap.locationForIndex(start);
    let endLoc = lineMap.locationForIndex(end);

    if (!startLoc || !endLoc) {
      throw new Error(`unable to find locations for range: [${start}, ${end})`);
    }

    let displayStartLine = Math.max(0, startLoc.line - 2);
    let displayEndLine = endLoc.line + 2;

    let rows: Array<Array<string>> = [];

    for (let line = displayStartLine; line <= displayEndLine; line++) {
      let startOfLine = lineMap.indexForLocation({ line, column: 0 });
      let endOfLine = lineMap.indexForLocation({ line: line + 1, column: 0 });
      if (startOfLine === null) {
        break;
      }
      if (endOfLine === null) {
        endOfLine = source.length;
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
        let highlightLength = Math.max(endLoc.column - startLoc.column, 1);
        rows.push(
          [`>`, `${line + 1} |`, lineSource],
          [``, `|`, ' '.repeat(startLoc.column) + '^'.repeat(highlightLength)]
        );
      } else {
        rows.push(
          [``, `${line + 1} |`, lineSource]
        );
      }
    }

    let columns: Array<Column> = [
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
