import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher.js';
import findSoakContainer from '../../../utils/findSoakContainer.js';

const GUARD_HELPER =
  `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedDynamicMemberAccessOpPatcher extends DynamicMemberAccessOpPatcher {
  patchAsExpression() {
    this.registerHelper('__guard__', GUARD_HELPER);
    let soakContainer = findSoakContainer(this);
    let varName = soakContainer.claimFreeBinding('x');
    this.overwrite(this.expression.outerEnd, this.indexingExpr.outerStart, `, ${varName} => ${varName}[`);
    soakContainer.insert(soakContainer.contentStart, '__guard__(');
    soakContainer.insert(soakContainer.contentEnd, ')');

    this.expression.patch();
    this.indexingExpr.patch();
  }
}
