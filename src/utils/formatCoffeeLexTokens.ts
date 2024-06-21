import { SourceType, SourceTokenList } from 'coffee-lex';

import CodeContext from './CodeContext';

export default function formatCoffeeLexTokens(tokens: SourceTokenList, context: CodeContext): string {
  const resultLines = tokens.map(
    (token) => `${context.formatRange(token.start, token.end)}: ${SourceType[token.type]}`,
  );
  return resultLines.map((line) => line + '\n').join('');
}
