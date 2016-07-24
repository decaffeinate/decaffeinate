/**
 * Display a range of code, e.g. for a token or an AST node.
 *
 * The line and column are displayed as 1-indexed, to agree with most editors,
 * and the actual 0-indexed code index is also displayed.
 *
 * For example, if a program is just "foo", then the "foo" token has this range:
 * [1:1(0)-1:4(3)]
 */
export default function formatRange(startIndex: number, endIndex: number, context) {
  return `[${formatIndex(startIndex, context)}-${formatIndex(endIndex, context)}]`;
}

function formatIndex(index: number, context) {
  if (index > context.source.length) {
    index = context.source.length;
  }
  let {line, column} = context.linesAndColumns.locationForIndex(index);
  return `${line + 1}:${column + 1}(${index})`;
}
