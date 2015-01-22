import parse from './utils/parse';
import traverse from './utils/traverse';
import MagicString from 'magic-string';
import patchThis from './patchers/patchThis';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchCallParens from './patchers/patchCallParens';
import patchCommas from './patchers/patchCommas';
import patchDeclarations from './patchers/patchDeclarations';
import patchReturns from './patchers/patchReturns';
import patchKeywords from './patchers/patchKeywords';
import patchStringInterpolation from './patchers/patchStringInterpolation';


/**
 * @typedef {{
 *   commas: boolean,
 *   callParens: boolean,
 *   declarations: boolean,
 *   functionParens: boolean,
 *   keywords: boolean,
 *   prototypeAccess: boolean,
 *   returns: boolean,
 *   stringInterpolation: boolean,
 *   this: boolean
 * }}
 **/
var ConvertOptions;

const ConvertOptionsKeys = [
  'commas',
  'callParens',
  'declarations',
  'functionParens',
  'keywords',
  'prototypeAccess',
  'returns',
  'stringInterpolation',
  'this'
];


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {ConvertOptions=} options
 * @returns {string}
 */
export function convert(source, options) {
  const ast = parse(source, { raw: true });
  const patcher = new MagicString(source);

  options = normalizeOptions(options);

  traverse(ast, function(node) {
    if (options.keywords) {
      patchKeywords(node, patcher);
    }

    if (options.this) {
      patchThis(node, patcher);
    }

    if (options.prototypeAccess) {
      patchPrototypeAccess(node, patcher);
    }

    if (options.stringInterpolation) {
      patchStringInterpolation(node, patcher);
    }

    if (options.callParens) {
      patchCallParens(node, patcher);
    }

    if (options.commas) {
      patchCommas(node, patcher);
    }

    if (options.declarations) {
      patchDeclarations(node, patcher);
    }

    if (options.returns) {
      patchReturns(node, patcher);
    }
  });

  return patcher.toString();
}

/**
 * @param {ConvertOptions=} options
 * @returns {ConvertOptions}
 */
function normalizeOptions(options=/** @type ConvertOptions */{}) {
  const result = /** @type ConvertOptions */{};
  ConvertOptionsKeys.forEach(key => {
    result[key] = (key in options) ? options[key] : true;
  });
  return result;
}
