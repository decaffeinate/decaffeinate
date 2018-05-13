import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import CodeContext from './CodeContext';

export default function formatCoffeeScriptLocationData(locationData: LocationData, context: CodeContext): string {
  let { first_line, first_column, last_line, last_column } = locationData;
  let firstIndex = context.linesAndColumns.indexForLocation({ line: first_line, column: first_column });
  if (firstIndex === null) {
    return 'INVALID RANGE';
  }
  let lastIndex = context.linesAndColumns.indexForLocation({ line: last_line, column: last_column });
  if (lastIndex === null) {
    return 'INVALID RANGE';
  }
  return context.formatRange(firstIndex, lastIndex + 1);
}
