import LinesAndColumns from 'lines-and-columns';

export default class CodeContext {
  readonly linesAndColumns: LinesAndColumns;

  constructor(readonly source: string) {
    this.linesAndColumns = new LinesAndColumns(source);
  }

  /**
   * Display a range of code, e.g. for a token or an AST node.
   *
   * The line and column are displayed as 1-indexed, to agree with most editors,
   * and the actual 0-indexed code index is also displayed.
   *
   * For example, if a program is just "foo", then the "foo" token has this range:
   * [1:1(0)-1:4(3)]
   */
  formatRange(startIndex: number, endIndex: number): string {
    return `[${this.formatIndex(startIndex)}-${this.formatIndex(endIndex)}]`;
  }

  formatIndex(index: number): string {
    if (index > this.source.length) {
      index = this.source.length;
    }
    let location = this.linesAndColumns.locationForIndex(index);
    if (!location) {
      return 'INVALID POSITION';
    }
    let {line, column} = location;
    return `${line + 1}:${column + 1}(${index})`;
  }

}
