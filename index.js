const parse = require('./lib/utils/parse').parse;
const traverse = require('./lib/utils/traverse').traverse;
const source = require('./lib/source');
const MagicString = require('magic-string');
const patchThis = require('./lib/patchers/patchThis').patchThis;
const patchPrototypeAccess = require('./lib/patchers/patchPrototypeAccess').patchPrototypeAccess;
const patchCallParens = require('./lib/patchers/patchCallParens').patchCallParens;
const patchCommas = require('./lib/patchers/patchCommas').patchCommas;
const patchDeclarations = require('./lib/patchers/patchDeclarations').patchDeclarations;


/** @typedef {{commas: boolean, callParens: boolean, functionParens: boolean, this: boolean, prototypeAccess: boolean, declarations: boolean}} */
var ConvertOptions;


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {{ConvertOptions}=} options
 * @returns {string}
 */
function convert(source, options) {
  var ast = parse(source, { raw: true });
  var patcher = new MagicString(source);

  const commas = (options && ('commas' in options)) ? options.commas : true;
  const functionParens = (options && ('functionParens' in options)) ? options.functionParens : true;
  const callParens = (options && ('callParens' in options)) ? options.callParens : true;
  const _this = (options && ('this' in options)) ? options.this : true;
  const prototypeAccess = (options && ('prototypeAccess' in options)) ? options.prototypeAccess : true;
  const declarations = (options && ('declarations' in options)) ? options.declarations : true;

  traverse(ast, function(node) {
    if (_this) {
      patchThis(node, patcher);
    }

    if (prototypeAccess) {
      patchPrototypeAccess(node, patcher);
    }

    if (callParens) {
      patchCallParens(node, patcher);
    }

    if (commas) {
      patchCommas(node, patcher);
    }

    if (declarations) {
      patchDeclarations(node, patcher);
    }
  });

  return patcher.toString();
}
exports.convert = convert;

