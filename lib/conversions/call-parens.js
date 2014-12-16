const source = require('../source');
const sourceOffsetForCSNodeStart = source.sourceOffsetForCSNodeStart;
const sourceOffsetForCSNodeEnd = source.sourceOffsetForCSNodeEnd;
const indentationAtOffset = source.indentationAtOffset;
const lastIndexOfSignificantCharacterInRange = source.lastIndexOfSignificantCharacterInRange;
const splitCall = require('../types').splitCall;

/**
 * Determines where and whether to add parentheses to a call.
 *
 * @param {string} source
 * @param {*} call
 * @returns {Diff[]}
 */
function getParenthesesDiffsForCall(source, call) {
  const calleeAndArgs = splitCall(call);
  const callee = calleeAndArgs[0];
  const args = calleeAndArgs[1];

  const endOfCallee = sourceOffsetForCSNodeEnd(
    source,
    (callee.properties && callee.properties.length > 0) ?
      callee.properties[callee.properties.length - 1] :
      callee
  );

  if (args.length > 0) {
    const startOfArgs = sourceOffsetForCSNodeStart(source, args[0]);
    const endOfArgs = sourceOffsetForCSNodeEnd(source, args[args.length - 1]);
    const lastNonWhitespaceOfArgs = lastIndexOfSignificantCharacterInRange(source, startOfArgs, endOfArgs);
    const betweenCalleeAndFirstArg = source.slice(endOfCallee, startOfArgs);

    if (betweenCalleeAndFirstArg.indexOf('(') < 0) {
      // No parentheses on this call.
      if (betweenCalleeAndFirstArg.indexOf('\n') < 0) {
        // First argument is on the same line.
        return [
          [0, source.slice(0, endOfCallee)],
          // Delete any spaces between the callee and the first argument.
          [-1, source.slice(endOfCallee, startOfArgs)],
          // Add an opening paren right after the callee.
          [1, '('],
          [0, source.slice(startOfArgs, lastNonWhitespaceOfArgs + 1)],
          // Add a closing paren right after the args.
          [1, ')'],
          [0, source.slice(lastNonWhitespaceOfArgs + 1)]
        ];
      } else {
        // First argument is on another line.
        const startOfCall = sourceOffsetForCSNodeStart(source, call);
        return [
          [0, source.slice(0, endOfCallee)],
          // Add an opening paren right after the callee.
          [1, '('],
          [0, source.slice(endOfCallee, lastNonWhitespaceOfArgs + 1)],
          // Add a closing paren on a new line with indent matching call start.
          [1, '\n' + indentationAtOffset(source, startOfCall) + ')'],
          [0, source.slice(lastNonWhitespaceOfArgs + 1)]
        ];
      }
    }
  } else if (source[endOfCallee] !== '(') {
    // e.g. `new Foo`
    return [
      [0, source.slice(0, endOfCallee)],
      [1, '()'],
      [0, source.slice(endOfCallee)]
    ];
  }

  return [];
}
exports.getParenthesesDiffsForCall = getParenthesesDiffsForCall;
