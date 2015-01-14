const parse = require('coffee-script-redux').parse;
const traverse = require('./lib/utils/traverse').traverse;
const source = require('./lib/source');
const MagicString = require('magic-string');


/** @typedef {(number|string)[]} */
var Diff;


/** @typedef {{commas: boolean, callParens: boolean, functionParens: boolean, this: boolean}} */
var ConvertOptions;


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {{ConvertOptions}=} options
 * @returns {string}
 */
function convert(source, options) {
  var ast = parse(source, { raw: true }).toBasicObject();
  var patcher = new MagicString(source);

  const commas = (options && ('commas' in options)) ? options.commas : true;
  const functionParens = (options && ('functionParens' in options)) ? options.functionParens : true;
  const callParens = (options && ('callParens' in options)) ? options.callParens : true;
  const _this = (options && ('this' in options)) ? options.this : true;

  if (_this) {
    traverse(ast, source, function(node) {
      if (node.type === 'This' && node.raw === '@') {
        patcher.replace(node.range[0], node.range[1], 'this');
      } else if (node.type === 'MemberAccessOp' && node.raw[0] === '@' && node.raw[1] !== '.') {
        patcher.insert(node.range[0] + 1, '.');
      }
    });
  }

  return patcher.toString();
}
exports.convert = convert;
