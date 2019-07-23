import { LocationData } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import CodeContext from './CodeContext';

export default function formatCoffeeScriptLocationData(locationData: LocationData, context: CodeContext): string {
  let firstIndex = context.linesAndColumns.indexForLocation({
    line: locationData.first_line,
    column: locationData.first_column
  });
  if (firstIndex === null) {
    return 'INVALID RANGE';
  }
  let lastIndex = context.linesAndColumns.indexForLocation({
    line: locationData.last_line,
    column: locationData.last_column
  });
  if (lastIndex === null) {
    return 'INVALID RANGE';
  }
  return context.formatRange(firstIndex, lastIndex + 1);
}
