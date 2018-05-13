import { REMOVE_GUARD, SHORTEN_NULL_CHECKS } from '../../../suggestions';
import findSoakContainer from '../../../utils/findSoakContainer';
import nodeContainsSoakOperation from '../../../utils/nodeContainsSoakOperation';
import ternaryNeedsParens from '../../../utils/ternaryNeedsParens';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

const GUARD_HELPER = `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedMemberAccessOpPatcher extends MemberAccessOpPatcher {
  _shouldSkipSoakPatch: boolean = false;

  patchAsExpression(): void {
    if (!this._shouldSkipSoakPatch) {
      if (this.shouldPatchAsOptionalChaining()) {
        this.patchAsOptionalChaining();
      } else if (this.shouldPatchAsConditional()) {
        this.patchAsConditional();
      } else {
        this.patchAsGuardCall();
      }
    } else {
      this.expression.patch();
    }
  }

  shouldPatchAsOptionalChaining(): boolean {
    return this.options.useOptionalChaining === true && !this.expression.mayBeUnboundReference();
  }

  shouldPatchAsConditional(): boolean {
    return this.expression.isRepeatable() && !nodeContainsSoakOperation(this.expression.node);
  }

  patchAsOptionalChaining(): void {
    // The operator is the same, so nothing special to do.
    this.expression.patch();
  }

  patchAsConditional(): void {
    this.addSuggestion(SHORTEN_NULL_CHECKS);
    let soakContainer = findSoakContainer(this);
    let memberNameToken = this.getMemberNameSourceToken();
    let expressionCode = this.expression.patchRepeatable();

    let conditionCode;
    if (this.expression.mayBeUnboundReference()) {
      conditionCode = `typeof ${expressionCode} !== 'undefined' && ${expressionCode} !== null`;
    } else {
      conditionCode = `${expressionCode} != null`;
    }

    this.overwrite(this.expression.outerEnd, memberNameToken.start, '.');
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
      soakContainer.insert(soakContainer.contentStart, `if (${conditionCode}) {\n${soakContainer.getIndent(1)}`);
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

    let memberNameToken = this.getMemberNameSourceToken();
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
