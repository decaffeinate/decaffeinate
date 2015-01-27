import parse from './utils/parse';
import traverse from './utils/traverse';
import MagicString from 'magic-string';
import patchCallParens from './patchers/patchCallParens';
import patchCommas from './patchers/patchCommas';
import patchDeclarations from './patchers/patchDeclarations';
import patchKeywords from './patchers/patchKeywords';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';


/**
 * @typedef {{
 *   commas: boolean,
 *   callParens: boolean,
 *   declarations: boolean,
 *   functionParens: boolean,
 *   keywords: boolean,
 *   prototypeAccess: boolean,
 *   returns: boolean,
 *   semicolons: boolean,
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
  'semicolons',
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

  traverse(ast, function(node, descend) {
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

    descend(node);

    if (options.semicolons) {
      patchSemicolons(node, patcher);
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
  Object.keys(options).forEach(key => {
    if (ConvertOptionsKeys.indexOf(key) < 0) {
      throw new Error('Unknown option: ' + key);
    }
  });
  return result;
}
