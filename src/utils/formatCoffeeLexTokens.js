import formatRange from './formatRange.js';

export default function formatCoffeeLexTokens(context): string {
  let tokens = context.sourceTokens;
  let resultLines = tokens.map(token =>
    `${formatRange(token.start, token.end, context)}: ${token.type.name}`
  );
  return resultLines.map(line => line + '\n').join('');
}
