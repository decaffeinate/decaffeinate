import { SourceType } from 'coffee-lex';
import ParseContext from 'decaffeinate-parser/dist/util/ParseContext';

import formatRange from './formatRange';

export default function formatCoffeeLexTokens(context: ParseContext): string {
  let tokens = context.sourceTokens;
  let resultLines = tokens.map(token =>
    `${formatRange(token.start, token.end, context)}: ${SourceType[token.type]}`
  );
  return resultLines.map(line => line + '\n').join('');
}
