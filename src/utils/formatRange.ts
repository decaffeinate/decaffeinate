/**
 * Display a range of code, e.g. for a token or an AST node.
 *
 * The line and column are displayed as 1-indexed, to agree with most editors,
 * and the actual 0-indexed code index is also displayed.
 *
 * For example, if a program is just "foo", then the "foo" token has this range:
 * [1:1(0)-1:4(3)]
 */
import DecaffeinateContext from './DecaffeinateContext';

export default function formatRange(startIndex: number, endIndex: number, context: DecaffeinateContext): string {
  return `[${formatIndex(startIndex, context)}-${formatIndex(endIndex, context)}]`;
}

function formatIndex(index: number, context: DecaffeinateContext): string {
  if (index > context.source.length) {
    index = context.source.length;
  }
  let location = context.linesAndColumns.locationForIndex(index);
  if (!location) {
    return 'INVALID POSITION';
  }
  let {line, column} = location;
  return `${line + 1}:${column + 1}(${index})`;
}
