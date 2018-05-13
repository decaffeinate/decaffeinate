import { SourceType } from 'coffee-lex';
import SourceTokenList from 'coffee-lex/dist/SourceTokenList';

import CodeContext from './CodeContext';

export default function formatCoffeeLexTokens(tokens: SourceTokenList, context: CodeContext): string {
  let resultLines = tokens.map(token => `${context.formatRange(token.start, token.end)}: ${SourceType[token.type]}`);
  return resultLines.map(line => line + '\n').join('');
}
