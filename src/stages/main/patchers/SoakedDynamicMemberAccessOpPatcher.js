import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import findSoakContainer from '../../../utils/findSoakContainer';

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

  patchAsExpression() {
    if (!this._shouldSkipSoakPatch) {
      this.registerHelper('__guard__', GUARD_HELPER);
      let soakContainer = findSoakContainer(this);
      let varName = soakContainer.claimFreeBinding('x');
      let prefix = this.slice(soakContainer.contentStart, this.contentStart);
      if (prefix.length > 0) {
        this.remove(soakContainer.contentStart, this.contentStart);
      }
      this.overwrite(this.expression.outerEnd, this.indexingExpr.outerStart, `, ${varName} => ${prefix}${varName}[`);
      soakContainer.insert(soakContainer.contentStart, '__guard__(');
      soakContainer.appendDeferredSuffix(')');
    }

    this.expression.patch();
    this.indexingExpr.patch();
  }

  setShouldSkipSoakPatch() {
    this._shouldSkipSoakPatch = true;
  }
}
