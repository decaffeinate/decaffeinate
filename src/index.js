import parse from './utils/parse';
import traverse from './utils/traverse';
import MagicString from 'magic-string';
import { patchCallOpening, patchCallClosing } from './patchers/patchCalls';
import patchCommas from './patchers/patchCommas';
import patchDeclarations from './patchers/patchDeclarations';
import patchKeywords from './patchers/patchKeywords';
import { patchObjectBraceOpening, patchObjectBraceClosing } from './patchers/patchObjectBraces';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @returns {string}
 */
export function convert(source) {
  const ast = parse(source, { raw: true });
  const patcher = new MagicString(source);

  traverse(ast, function(node, descend) {
    patchKeywords(node, patcher);
    patchThis(node, patcher);
    patchPrototypeAccess(node, patcher);
    patchStringInterpolation(node, patcher);
    patchCallOpening(node, patcher);
    patchObjectBraceOpening(node, patcher);
    patchCommas(node, patcher);
    patchDeclarations(node, patcher);
    patchReturns(node, patcher);

    descend(node);

    patchObjectBraceClosing(node, patcher);
    patchCallClosing(node, patcher);
    patchSemicolons(node, patcher);
  });

  return patcher.toString();
}
