import MagicString from 'magic-string';
import parse from './utils/parse';
import patchCommas from './patchers/patchCommas';
import patchDeclarations from './patchers/patchDeclarations';
import patchKeywords from './patchers/patchKeywords';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchSequences from './patchers/patchSequences';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';
import traverse from './utils/traverse';
import { patchCallOpening, patchCallClosing } from './patchers/patchCalls';
import { patchFunctionStart, patchFunctionEnd } from './patchers/patchFunctions';
import { patchObjectBraceOpening, patchObjectBraceClosing } from './patchers/patchObjectBraces';

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
    patchDeclarations(node, patcher);
    patchReturns(node, patcher);
    patchFunctionStart(node, patcher);

    descend(node);

    patchFunctionEnd(node, patcher);
    patchObjectBraceClosing(node, patcher);
    patchCallClosing(node, patcher);
    patchSemicolons(node, patcher);
    patchSequences(node, patcher);
    patchCommas(node, patcher);
  });

  return patcher.toString();
}
