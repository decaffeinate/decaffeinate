import { LocationData } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import ParseContext from 'decaffeinate-parser/dist/util/ParseContext';
import formatRange from './formatRange';

export default function formatCoffeeScriptLocationData(locationData: LocationData, context: ParseContext) {
  let {first_line, first_column, last_line, last_column} = locationData;
  let firstIndex = context.linesAndColumns.indexForLocation({line: first_line, column: first_column});
  if (firstIndex === null) {
    return 'INVALID RANGE';
  }
  let lastIndex = context.linesAndColumns.indexForLocation({line: last_line, column: last_column});
  if (lastIndex === null) {
    return 'INVALID RANGE';
  }
  return formatRange(firstIndex, lastIndex + 1, context);
}
