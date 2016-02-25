import detectIndent from 'detect-indent';

const DEFAULT_INDENT = '  ';

/**
 * @param {string} source
 * @returns {string}
 */
export default function determineIndent(source) {
  let indent = detectIndent(source);
  if (indent.type === 'space' && indent.amount % 2 === 1) {
    return DEFAULT_INDENT;
  }
  return indent.indent || DEFAULT_INDENT;
}
