import { REMOVE_GUARD, SHORTEN_NULL_CHECKS } from '../../../suggestions';
import findSoakContainer from '../../../utils/findSoakContainer';
import nodeContainsSoakOperation from '../../../utils/nodeContainsSoakOperation';
import ternaryNeedsParens from '../../../utils/ternaryNeedsParens';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

const GUARD_HELPER = `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedMemberAccessOpPatcher extends MemberAccessOpPatcher {
  _shouldSkipSoakPatch = false;

  patchAsExpression(): void {
    if (!this._shouldSkipSoakPatch) {
      if (this.shouldPatchAsConditional()) {
        this.patchAsConditional();
      } else {
        this.patchAsGuardCall();
      }
    } else {
      this.expression.patch();
    }
  }

  shouldPatchAsConditional(): boolean {
    return this.expression.isRepeatable() && !nodeContainsSoakOperation(this.expression.node);
  }

  patchAsConditional(): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    const soakContainer = findSoakContainer(this);
    const memberNameToken = this.getMemberNameSourceToken();
    const expressionCode = this.expression.patchRepeatable();

    let conditionCode: string;
    if (this.expression.mayBeUnboundReference()) {
      conditionCode = `typeof ${expressionCode} !== 'undefined' && ${expressionCode} !== null`;
    } else {
      conditionCode = `${expressionCode} != null`;
    }

    this.overwrite(this.expression.outerEnd, memberNameToken.start, '.');
    if (soakContainer.willPatchAsExpression()) {
      const containerNeedsParens = ternaryNeedsParens(soakContainer);
      if (containerNeedsParens) {
        soakContainer.insert(soakContainer.contentStart, '(');
      }
      soakContainer.insert(soakContainer.contentStart, `${conditionCode} ? `);
      soakContainer.appendDeferredSuffix(' : undefined');
      if (containerNeedsParens) {
        soakContainer.appendDeferredSuffix(')');
      }
    } else {
      soakContainer.insert(soakContainer.contentStart, `if (${conditionCode}) {\n${soakContainer.getIndent(1)}`);
      soakContainer.appendDeferredSuffix(`\n${soakContainer.getIndent()}}`);
    }
  }

  patchAsGuardCall(): void {
    this.registerHelper('__guard__', GUARD_HELPER);
    this.addSuggestion(REMOVE_GUARD);

    const soakContainer = findSoakContainer(this);
    const varName = soakContainer.claimFreeBinding('x');
    const prefix = this.slice(soakContainer.contentStart, this.contentStart);

    if (prefix.length > 0) {
      this.remove(soakContainer.contentStart, this.contentStart);
    }

    const memberNameToken = this.getMemberNameSourceToken();
    this.overwrite(this.expression.outerEnd, memberNameToken.start, `, ${varName} => ${prefix}${varName}.`);

    soakContainer.insert(soakContainer.contentStart, '__guard__(');
    soakContainer.appendDeferredSuffix(')');

    this.expression.patch();
  }

  setShouldSkipSoakPatch(): void {
    this._shouldSkipSoakPatch = true;
  }

  /**
   * There isn't an implicit-dot syntax like @a for soaked access.
   */
  hasImplicitOperator(): boolean {
    return false;
  }
}
