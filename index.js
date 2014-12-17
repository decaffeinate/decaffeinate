const parse = require('coffee-script').nodes;
const traverse = require('./lib/types').visit;
const types = require('./lib/types');
const source = require('./lib/source');
const fixClosingParenthesesOrder = source.fixClosingParenthesesOrder;
const isArr = types.isArr;
const isCall = types.isCall;
const isCode = types.isCode;
const isLiteral = types.isLiteral;
const isNew = types.isNew;
const isObj = types.isObj;
const isValue = types.isValue;
const getCommaDiffsForList = require('./lib/conversions/commas').getCommaDiffsForList;
const getParenthesesDiffsForCall = require('./lib/conversions/call-parens').getParenthesesDiffsForCall;
const getParenthesesDiffsForFunction = require('./lib/conversions/function-parens').getParenthesesDiffsForFunction;
const getThisDiffForValue = require('./lib/conversions/this').getThisDiffForValue;
const DiffMatchPatch = require('googlediff');
const dmp = new DiffMatchPatch();


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
  var ast;
  var patches;

  const commas = (options && ('commas' in options)) ? options.commas : true;
  const functionParens = (options && ('functionParens' in options)) ? options.functionParens : true;
  const callParens = (options && ('callParens' in options)) ? options.callParens : true;
  const _this = (options && ('this' in options)) ? options.this : true;

  if (functionParens) {
    ast = parse(source);
    patches = [];

    traverse(ast, function(node) {
      if (isCode(node)) {
        const diffs = getParenthesesDiffsForFunction(source, node);
        if (diffs.length > 0) {
          patches.push(dmp.patch_make(source, diffs));
        }
      }
    });

    source = applyPatches(source, patches);
  }

  if (callParens) {
    ast = parse(source);
    patches = [];

    traverse(ast, function(node) {
      if (isCall(node) || isNew(node)) {
        const diffs = getParenthesesDiffsForCall(source, node);
        if (diffs.length > 0) {
          patches.push(dmp.patch_make(source, diffs));
        }
      }
    });

    source = applyPatches(source, patches);
  }

  if (commas) {
    ast = parse(source);
    patches = [];

    traverse(ast, function(node) {
      var diffs;

      if (isArr(node) || isObj(node)) {
        diffs = getCommaDiffsForList(source, node.objects);
      } else if (isCall(node) || isNew(node)) {
        diffs = getCommaDiffsForList(source, node.args);
      } else {
        diffs = [];
      }

      if (diffs.length > 0) {
        patches.push(dmp.patch_make(source, diffs));
      }
    });

    source = applyPatches(source, patches);
  }

  if (_this) {
    ast = parse(source);
    patches = [];

    traverse(ast, function(node) {
      var diffs;

      if (isValue(node) && isLiteral(node.base) && node.base.value === 'this') {
        diffs = getThisDiffForValue(source, node);
        patches.push(dmp.patch_make(source, diffs));
      }
    });

    source = applyPatches(source, patches);
  }

  return source;
}
exports.convert = convert;


/**
 * Splices strings into the given source at the requested positions.
 *
 * @param {string} source
 * @param {Patch[]} patches
 * @returns {string}
 */
function applyPatches(source, patches) {
  patches.forEach(function(patch) {
    const result = dmp.patch_apply(patch, source);
    // TODO: Error handling.
    source = result[0];
  });
  return fixClosingParenthesesOrder(source);
}
