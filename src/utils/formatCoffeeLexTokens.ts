import { SourceType } from 'coffee-lex';

import DecaffeinateContext from './DecaffeinateContext';
import formatRange from './formatRange';

export default function formatCoffeeLexTokens(context: DecaffeinateContext): string {
  let tokens = context.sourceTokens;
  let resultLines = tokens.map(token =>
    `${formatRange(token.start, token.end, context)}: ${SourceType[token.type]}`
  );
  return resultLines.map(line => line + '\n').join('');
}
