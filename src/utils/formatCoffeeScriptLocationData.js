import formatRange from './formatRange.js';

export default function formatCoffeeScriptLocationData(locationData, context) {
  let {first_line, first_column, last_line, last_column} = locationData;
  let firstIndex = context.linesAndColumns.indexForLocation({line: first_line, column: first_column});
  let lastIndex = context.linesAndColumns.indexForLocation({line: last_line, column: last_column}) + 1;
  return formatRange(firstIndex, lastIndex, context);
}
