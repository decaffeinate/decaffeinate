import MagicString from 'magic-string';
import parse from './utils/parse';
import patchCommas from './patchers/patchCommas';
import patchComments from './patchers/patchComments';
import patchDeclarations from './patchers/patchDeclarations';
import patchEmbeddedJavaScript from './patchers/patchEmbeddedJavaScript';
import patchEquality from './patchers/patchEquality';
import patchKeywords from './patchers/patchKeywords';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchSequences from './patchers/patchSequences';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';
import preprocessBinaryExistentialOperator from './preprocessors/preprocessBinaryExistentialOperator';
import preprocessConditional from './preprocessors/preprocessConditional';
import preprocessSoakedMemberAccessOp from './preprocessors/preprocessSoakedMemberAccessOp';
import traverse from './utils/traverse';
import { patchCallOpening, patchCallClosing } from './patchers/patchCalls';
import { patchClassStart, patchClassEnd } from './patchers/patchClass';
import { patchConditionalStart, patchConditionalEnd } from './patchers/patchConditional';
import { patchExistentialOperatorStart, patchExistentialOperatorEnd } from './patchers/patchExistentialOperator';
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
  const ast = parse(source);
  const patcher = new MagicString(source);

  let wasRewritten = false;

  traverse(ast, (node) => {
    if (wasRewritten) {
      return false;
    }
    wasRewritten = preprocessConditional(node, patcher) ||
      preprocessBinaryExistentialOperator(node, patcher) ||
      preprocessSoakedMemberAccessOp(node, patcher);
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
    patchEmbeddedJavaScript(node, patcher);
    patchExistentialOperatorStart(node, patcher);

    descend(node);

    patchConditionalEnd(node, patcher);
    patchThrowEnd(node, patcher);
    patchExistentialOperatorEnd(node, patcher);
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
