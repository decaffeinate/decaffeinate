const parse = require('coffee-script').nodes;
const traverse = require('./lib/types').visit;
const types = require('./lib/types');
const isArr = types.isArr;
const isObj = types.isObj;
const isCall = types.isCall;
const isNew = types.isNew;
const getCommaSplicesForList = require('./lib/conversions/commas').getCommaSplicesForList;
const getParenthesesSplicesForCall = require('./lib/conversions/call-parens').getParenthesesSplicesForCall;


/** @typedef {{start: number, end: number, value: string}} */
var Splice;


/** @typedef {{commas: boolean, callParens: boolean}} */
var ConvertOptions;


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {{ConvertOptions}=} options
 * @returns {string}
 */
function convert(source, options) {
  var ast;
  var splices;

  const commas = (options && ('commas' in options)) ? options.commas : true;
  const callParens = (options && ('callParens' in options)) ? options.callParens : true;

  if (commas) {
    ast = parse(source);
    splices = [];

    traverse(ast, function(node) {
      if (isArr(node) || isObj(node)) {
        splices = splices.concat(getCommaSplicesForList(source, node.objects));
      } else if (isCall(node) || isNew(node)) {
        splices = splices.concat(getCommaSplicesForList(source, node.args));
      }
    });

    source = performSplices(source, splices);
  }

  if (callParens) {
    ast = parse(source);
    splices = [];

    traverse(ast, function(node) {
      if (isCall(node) || isNew(node)) {
        splices = splices.concat(getParenthesesSplicesForCall(source, node));
      }
    });

    source = performSplices(source, splices);
  }

  return source;
}
exports.convert = convert;


/**
 * Splices strings into the given source at the requested positions.
 *
 * @param {string} source
 * @param {Splice[]} splice
 * @returns {string}
 */
function performSplices(source, splice) {
  // Reverse-sort by index.
  splice = splice.slice().sort(function(left, right) {
    return right.end - left.end;
  });

  splice.forEach(function(splice) {
    source = source.slice(0, splice.start) + splice.value + source.slice(splice.end);
  });

  return source;
}
