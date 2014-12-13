const source = require('../source');
const sourceOffsetForCSNodeStart = source.sourceOffsetForCSNodeStart;
const sourceOffsetForCSNodeEnd = source.sourceOffsetForCSNodeEnd;
const indentationAtOffset = source.indentationAtOffset;
const lastIndexOfNonWhitespace = source.lastIndexOfNonWhitespace;
const splitCall = require('../types').splitCall;

/**
 * Determines where and whether to add parentheses to a call.
 *
 * @param {string} source
 * @param {*} call
 * @returns {Splice[]}
 */
function getParenthesesSplicesForCall(source, call) {
  const calleeAndArgs = splitCall(call);
  const callee = calleeAndArgs[0];
  const args = calleeAndArgs[1];

  const endOfCallee = sourceOffsetForCSNodeEnd(
    source,
    (callee.properties.length > 0) ?
      callee.properties[callee.properties.length - 1] :
      callee
  );

  if (args.length > 0) {
    const startOfArgs = sourceOffsetForCSNodeStart(source, args[0]);
    const endOfArgs = sourceOffsetForCSNodeEnd(source, args[args.length - 1]);
    const lastNonWhitespaceOfArgs = lastIndexOfNonWhitespace(source, endOfArgs - 1);
    const betweenCalleeAndFirstArg = source.slice(endOfCallee, startOfArgs);

    if (betweenCalleeAndFirstArg.indexOf('(') < 0) {
      // No parentheses on this call.
      if (betweenCalleeAndFirstArg.indexOf('\n') < 0) {
        // First argument is on the same line.
        return [
          // Add an opening paren right after the callee.
          { start: endOfCallee, end: startOfArgs, value: '(' },
          // Add a closing paren right after the args.
          { start: lastNonWhitespaceOfArgs + 1, end: lastNonWhitespaceOfArgs + 1, value: ')' }
        ];
      } else {
        // First argument is on another line.
        const startOfCall = sourceOffsetForCSNodeStart(source, call);
        return [
          // Add an opening paren right after the callee.
          {
            start: endOfCallee,
            end: endOfCallee,
            value: '('
          },
          // Add a closing paren on a new line with indent matching call start.
          {
            start: lastNonWhitespaceOfArgs + 1,
            end: lastNonWhitespaceOfArgs + 1,
            value: '\n' + indentationAtOffset(source, startOfCall) + ')'
          }
        ];
      }
    }
  } else if (source[endOfCallee] !== '(') {
    // e.g. `new Foo`
    return [{ start: endOfCallee, end: endOfCallee, value: '()' }];
  }

  return [];
}
exports.getParenthesesSplicesForCall = getParenthesesSplicesForCall;
