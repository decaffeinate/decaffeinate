import formatCoffeeScriptLocationData from './formatCoffeeScriptLocationData.js';

export default function formatCoffeeScriptLexerTokens(tokens, context): string {
  let resultLines = tokens.map(([tag, value, locationData]) =>
    `${formatCoffeeScriptLocationData(locationData, context)}: ${tag}: ${JSON.stringify(value)}`
  );
  return resultLines.map(line => line + '\n').join('');
}
