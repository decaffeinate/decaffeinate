import { Token } from 'decaffeinate-coffeescript2/lib/coffeescript/lexer';
import CodeContext from './CodeContext';
import formatCoffeeScriptLocationData from './formatCoffeeScriptLocationData';

export default function formatCoffeeScriptLexerTokens(tokens: Array<Token>, context: CodeContext): string {
  const resultLines = tokens.map(
    ([tag, value, locationData]) =>
      `${formatCoffeeScriptLocationData(locationData, context)}: ${tag}: ${JSON.stringify(value)}`
  );
  return resultLines.map(line => line + '\n').join('');
}
