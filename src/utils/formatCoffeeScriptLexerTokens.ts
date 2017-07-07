import { Token } from 'decaffeinate-coffeescript/lib/coffee-script/lexer';
import DecaffeinateContext from './DecaffeinateContext';
import formatCoffeeScriptLocationData from './formatCoffeeScriptLocationData';

export default function formatCoffeeScriptLexerTokens(tokens: Array<Token>, context: DecaffeinateContext): string {
  let resultLines = tokens.map(([tag, value, locationData]) =>
    `${formatCoffeeScriptLocationData(locationData, context)}: ${tag}: ${JSON.stringify(value)}`
  );
  return resultLines.map(line => line + '\n').join('');
}
