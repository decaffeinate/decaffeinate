import MagicString from 'magic-string';
import parse from './utils/parse';
import patchCommas from './patchers/patchCommas';
import patchComments from './patchers/patchComments';
import patchDeclarations from './patchers/patchDeclarations';
import patchEmbeddedJavaScript from './patchers/patchEmbeddedJavaScript';
import patchEquality from './patchers/patchEquality';
import patchKeywords from './patchers/patchKeywords';
import patchPrototypeAccess from './patchers/patchPrototypeAccess';
import patchRegularExpressions from './patchers/patchRegularExpressions';
import patchReturns from './patchers/patchReturns';
import patchSemicolons from './patchers/patchSemicolons';
import patchSequences from './patchers/patchSequences';
import patchStringInterpolation from './patchers/patchStringInterpolation';
import patchThis from './patchers/patchThis';
import preprocessBinaryExistentialOperator from './preprocessors/preprocessBinaryExistentialOperator';
import preprocessCompoundAssignment from './preprocessors/preprocessCompoundAssignment';
import preprocessConditional from './preprocessors/preprocessConditional';
import preprocessDo from './preprocessors/preprocessDo';
import preprocessParameters from './preprocessors/preprocessParameters';
import preprocessRange from './preprocessors/preprocessRange';
import preprocessSoakedMemberAccessOp from './preprocessors/preprocessSoakedMemberAccessOp';
import preprocessSwitch from './preprocessors/preprocessSwitch';
import preprocessTry from './preprocessors/preprocessTry';
import preprocessWhile from './preprocessors/preprocessWhile';
import traverse from './utils/traverse';
import { patchCallOpening, patchCallClosing } from './patchers/patchCalls';
import { patchClassStart, patchClassEnd } from './patchers/patchClass';
import { patchConditionalStart, patchConditionalEnd } from './patchers/patchConditional';
import { patchExistentialOperatorStart, patchExistentialOperatorEnd } from './patchers/patchExistentialOperator';
import { patchFunctionStart, patchFunctionEnd } from './patchers/patchFunctions';
import { patchObjectBraceOpening, patchObjectBraceClosing } from './patchers/patchObjectBraces';
import { patchRestStart, patchRestEnd } from './patchers/patchRest';
import { patchSliceStart, patchSliceEnd } from './patchers/patchSlice';
import { patchSpreadStart, patchSpreadEnd } from './patchers/patchSpread';
import { patchSwitchStart, patchSwitchEnd } from './patchers/patchSwitch';
import { patchThrowStart, patchThrowEnd } from './patchers/patchThrow';
import { patchTryStart, patchTryEnd } from './patchers/patchTry';
import { patchWhileStart, patchWhileEnd } from './patchers/patchWhile';

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
    wasRewritten = preprocessCompoundAssignment(node, patcher) ||
      preprocessDo(node, patcher) ||
      preprocessConditional(node, patcher) ||
      preprocessBinaryExistentialOperator(node, patcher) ||
      preprocessParameters(node, patcher) ||
      preprocessRange(node, patcher) ||
      preprocessSwitch(node, patcher) ||
      preprocessSoakedMemberAccessOp(node, patcher) ||
      preprocessTry(node, patcher) ||
      preprocessWhile(node, patcher);
  });

  if (wasRewritten) {
    return convert(patcher.toString());
  }

  traverse(ast, (node, descend) => {
    patchConditionalStart(node, patcher);
    patchWhileStart(node, patcher);
    patchRegularExpressions(node, patcher);
    patchReturns(node, patcher);
    patchKeywords(node, patcher);
    patchThis(node, patcher);
    patchPrototypeAccess(node, patcher);
    patchStringInterpolation(node, patcher);
    patchSliceStart(node, patcher);
    patchCallOpening(node, patcher);
    patchObjectBraceOpening(node, patcher);
    patchDeclarations(node, patcher);
    patchFunctionStart(node, patcher);
    patchClassStart(node, patcher);
    patchEquality(node, patcher);
    patchThrowStart(node, patcher);
    patchSpreadStart(node, patcher);
    patchSwitchStart(node, patcher);
    patchRestStart(node, patcher);
    patchTryStart(node, patcher);
    patchEmbeddedJavaScript(node, patcher);
    patchExistentialOperatorStart(node, patcher);

    descend(node);

    patchTryEnd(node, patcher);
    patchWhileEnd(node, patcher);
    patchConditionalEnd(node, patcher);
    patchThrowEnd(node, patcher);
    patchExistentialOperatorEnd(node, patcher);
    patchFunctionEnd(node, patcher);
    patchClassEnd(node, patcher);
    patchObjectBraceClosing(node, patcher);
    patchSliceEnd(node, patcher);
    patchCallClosing(node, patcher);
    patchSemicolons(node, patcher);
    patchSequences(node, patcher);
    patchCommas(node, patcher);
    patchSpreadEnd(node, patcher);
    patchSwitchEnd(node, patcher);
    patchRestEnd(node, patcher);
  });

  patchComments(patcher);

  return patcher.toString();
}
