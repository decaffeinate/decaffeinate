import MagicString from 'magic-string';
import parse from './utils/parse';
import patchCommas from './patchers/patchCommas';
import patchComments from './patchers/patchComments';
import patchDeclarations from './patchers/patchDeclarations';
import patchEquality from './patchers/patchEquality';
import patchExistentialOperator from './patchers/patchExistentialOperator';
import patchKeywords from './patchers/patchKeywords';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchSequences from './patchers/patchSequences';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';
import preprocessConditional from './preprocessors/preprocessConditional';
import traverse from './utils/traverse';
import { patchCallOpening, patchCallClosing } from './patchers/patchCalls';
import { patchClassStart, patchClassEnd } from './patchers/patchClass';
import { patchConditionalStart, patchConditionalEnd } from './patchers/patchConditional';
import { patchFunctionStart, patchFunctionEnd } from './patchers/patchFunctions';
import { patchObjectBraceOpening, patchObjectBraceClosing } from './patchers/patchObjectBraces';
import { patchSpreadStart, patchSpreadEnd } from './patchers/patchSpread';
import { patchThrowStart, patchThrowEnd } from './patchers/patchThrow';

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @returns {string}
 */
export function convert(source) {
  const ast = parse(source, { raw: true });
  const patcher = new MagicString(source);

  let wasRewritten = false;

  traverse(ast, (node) => {
    if (wasRewritten) {
      return false;
    }
    wasRewritten = preprocessConditional(node, patcher);
  });

  if (wasRewritten) {
    return convert(patcher.toString());
  }

  traverse(ast, (node, descend) => {
    patchKeywords(node, patcher);
    patchThis(node, patcher);
    patchPrototypeAccess(node, patcher);
    patchStringInterpolation(node, patcher);
    patchCallOpening(node, patcher);
    patchObjectBraceOpening(node, patcher);
    patchDeclarations(node, patcher);
    patchReturns(node, patcher);
    patchFunctionStart(node, patcher);
    patchClassStart(node, patcher);
    patchEquality(node, patcher);
    patchThrowStart(node, patcher);
    patchSpreadStart(node, patcher);
    patchConditionalStart(node, patcher);

    descend(node);

    patchConditionalEnd(node, patcher);
    patchThrowEnd(node, patcher);
    patchExistentialOperator(node, patcher);
    patchFunctionEnd(node, patcher);
    patchClassEnd(node, patcher);
    patchObjectBraceClosing(node, patcher);
    patchCallClosing(node, patcher);
    patchSemicolons(node, patcher);
    patchSequences(node, patcher);
    patchCommas(node, patcher);
    patchSpreadEnd(node, patcher);
  });

  patchComments(patcher);

  return patcher.toString();
}
