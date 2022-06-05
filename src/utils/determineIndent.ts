// eslint-disable-next-line @typescript-eslint/no-var-requires
const detectIndent = require('detect-indent') as typeof import('detect-indent');

const DEFAULT_INDENT = '  ';

export default function determineIndent(source: string): string {
  const indent = detectIndent(source);
  if (indent.type === 'space' && indent.amount % 2 === 1) {
    return DEFAULT_INDENT;
  }
  return indent.indent || DEFAULT_INDENT;
}
