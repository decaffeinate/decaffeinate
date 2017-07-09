import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import { REMOVE_GUARD, SHORTEN_NULL_CHECKS } from '../../../suggestions';
import findSoakContainer from '../../../utils/findSoakContainer';
import nodeContainsSoakOperation from '../../../utils/nodeContainsSoakOperation';
import ternaryNeedsParens from '../../../utils/ternaryNeedsParens';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';

const GUARD_HELPER =
  `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedDynamicMemberAccessOpPatcher extends DynamicMemberAccessOpPatcher {
  _shouldSkipSoakPatch: boolean;

  constructor(patcherContext: PatcherContext, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(patcherContext, expression, indexingExpr);
    this._shouldSkipSoakPatch = false;
  }

  patchAsExpression(): void {
    if (!this._shouldSkipSoakPatch) {
      if (this.shouldPatchAsConditional()) {
        this.patchAsConditional();
      } else {
        this.patchAsGuardCall();
      }
    } else {
      this.expression.patch();
      this.indexingExpr.patch();
    }
  }

  shouldPatchAsConditional(): boolean {
    return this.expression.isRepeatable() && !nodeContainsSoakOperation(this.expression.node);
  }

  patchAsConditional(): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    let soakContainer = findSoakContainer(this);
    let expressionCode = this.expression.patchRepeatable();

    let conditionCode;
    if (this.expression.mayBeUnboundReference()) {
      conditionCode = `typeof ${expressionCode} !== 'undefined' && ${expressionCode} !== null`;
    } else {
      conditionCode = `${expressionCode} != null`;
    }

    this.overwrite(this.expression.outerEnd, this.indexingExpr.outerStart, '[');
    this.indexingExpr.patch();
    if (soakContainer.willPatchAsExpression()) {
      let containerNeedsParens = ternaryNeedsParens(soakContainer);
      if (containerNeedsParens) {
        soakContainer.insert(soakContainer.contentStart, '(');
      }
      soakContainer.insert(soakContainer.contentStart, `${conditionCode} ? `);
      soakContainer.appendDeferredSuffix(' : undefined');
      if (containerNeedsParens) {
        soakContainer.appendDeferredSuffix(')');
      }
    } else {
      soakContainer.insert(
        soakContainer.contentStart,  `if (${conditionCode}) {\n${soakContainer.getIndent(1)}`);
      soakContainer.appendDeferredSuffix(`\n${soakContainer.getIndent()}}`);
    }
  }

  patchAsGuardCall(): void {
    this.registerHelper('__guard__', GUARD_HELPER);
    this.addSuggestion(REMOVE_GUARD);
    let soakContainer = findSoakContainer(this);
    let varName = soakContainer.claimFreeBinding('x');
    let prefix = this.slice(soakContainer.contentStart, this.contentStart);
    if (prefix.length > 0) {
      this.remove(soakContainer.contentStart, this.contentStart);
    }
    this.overwrite(this.expression.outerEnd, this.indexingExpr.outerStart, `, ${varName} => ${prefix}${varName}[`);
    soakContainer.insert(soakContainer.contentStart, '__guard__(');
    soakContainer.appendDeferredSuffix(')');

    this.expression.patch();
    this.indexingExpr.patch();
  }

  setShouldSkipSoakPatch(): void {
    this._shouldSkipSoakPatch = true;
  }
}
