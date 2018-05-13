const detectIndent = require('detect-indent');

const DEFAULT_INDENT = '  ';

export default function determineIndent(source: string): string {
  let indent: { amount: number; type: 'space' | 'tab'; indent: string } = detectIndent(source);
  if (indent.type === 'space' && indent.amount % 2 === 1) {
    return DEFAULT_INDENT;
  }
  return indent.indent || DEFAULT_INDENT;
}
