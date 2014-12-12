const parse = require('coffee-script').nodes;
const traverse = require('./lib/types').visit;
const types = require('./lib/types');
const isArr = types.isArr;
const isObj = types.isObj;
const isCall = types.isCall;
const getCommaInsertionsForList = require('./lib/conversions/commas').getCommaInsertionsForList;


/** @typedef {{index: number, value: string}} */
var Insertion;


/** @typedef {{commas: boolean}} */
var ConvertOptions;


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {{ConvertOptions}=} options
 * @returns {string}
 */
function convert(source, options) {
  const ast = parse(source);
  var insertions = [];

  const commas = (options && ('commas' in options)) ? options.commas : true;

  traverse(ast, function(node) {
    if (isArr(node) || isObj(node)) {
      if (commas) {
        insertions = insertions.concat(getCommaInsertionsForList(source, node.objects));
      }
    } else if (isCall(node)) {
      if (commas) {
        insertions = insertions.concat(getCommaInsertionsForList(source, node.args));
      }
    }
  });

  return performInsertions(source, insertions);
}
exports.convert = convert;


/**
 * Inserts strings into the given source at the requested positions.
 *
 * @param {string} source
 * @param {Insertion[]} insertions
 * @returns {string}
 */
function performInsertions(source, insertions) {
  // Reverse-sort by index.
  insertions = insertions.slice().sort(function(left, right) {
    return right.index - left.index;
  });

  insertions.forEach(function(insertion) {
    source = source.slice(0, insertion.index) + insertion.value + source.slice(insertion.index);
  });

  return source;
}
