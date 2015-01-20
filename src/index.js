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


/**
 * @typedef {{
 *   commas: boolean,
 *   callParens: boolean,
 *   declarations: boolean,
 *   functionParens: boolean,
 *   keywords: boolean,
 *   prototypeAccess: boolean,
 *   returns: boolean,
 *   this: boolean,
 * }}
 **/
var ConvertOptions;


/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @param {ConvertOptions=} options
 * @returns {string}
 */
export function convert(source, options) {
  var ast = parse(source, { raw: true });
  var patcher = new MagicString(source);

  const commas = (options && ('commas' in options)) ? options.commas : true;
  const callParens = (options && ('callParens' in options)) ? options.callParens : true;
  const declarations = (options && ('declarations' in options)) ? options.declarations : true;
  const functionParens = (options && ('functionParens' in options)) ? options.functionParens : true;
  const keywords = (options && ('keywords' in options)) ? options.keywords : true;
  const prototypeAccess = (options && ('prototypeAccess' in options)) ? options.prototypeAccess : true;
  const returns = (options && ('returns' in options)) ? options.returns : true;
  const this_ = (options && ('this' in options)) ? options.this : true;

  traverse(ast, function(node) {
    if (keywords) {
      patchKeywords(node, patcher);
    }

    if (this_) {
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

    if (returns) {
      patchReturns(node, patcher);
    }
  });

  return patcher.toString();
}
