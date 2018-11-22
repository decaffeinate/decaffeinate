import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { REMOVE_GUARD } from '../../../suggestions';
import findSoakContainer from '../../../utils/findSoakContainer';
import nodeContainsSoakOperation from '../../../utils/nodeContainsSoakOperation';
import notNull from '../../../utils/notNull';
import ternaryNeedsParens from '../../../utils/ternaryNeedsParens';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import SoakedDynamicMemberAccessOpPatcher from './SoakedDynamicMemberAccessOpPatcher';
import SoakedMemberAccessOpPatcher from './SoakedMemberAccessOpPatcher';

const GUARD_FUNC_HELPER = `function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}`;

/**
 * Special guard function so that the calling code can properly specify the
 * proper `this` value in the call.
 *
 * Note that this method is slightly incorrect in that it's more defensive than
 * `a.b?()`; it does a null check on `a`, when CoffeeScript code would crash on
 * null/undefined `a`. This may be possible to correct in the future, but there
 * are a few reasons it's useful in the current implementation:
 * - The implementation of soak chaining requires that soak operations do
 *   nothing if their leftmost value is undefined, e.g. that `a?.b?.c` can be
 *   correctly rewritten as `(a?.b)?.c`. Soaked method-style function
 *   application is a counterexample, though: `a?.b.c?()` cannot be rewritten as
 *   `(a?.b).c?()`, since the second one crashes if `a` is null. So, instead, we
 *   effectively treat it as `(a?.b)?.c?()`, which again isn't 100% correct, but
 *   will properly guard on `a` being null/undefined.
 * - We'd need a function like this anyway to transform code like `a?.b?()`, so
 *   this avoids the need to have two slightly different functions to handle
 *   this case which is already fairly obscure.
 */
const GUARD_METHOD_HELPER = `function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}`;

export default class SoakedFunctionApplicationPatcher extends FunctionApplicationPatcher {
  patchAsExpression(): void {
    if (this.shouldPatchAsConditional()) {
      this.patchAsConditional();
    } else {
      if (this.fn instanceof MemberAccessOpPatcher) {
        this.patchMethodCall(this.fn);
      } else if (this.fn instanceof DynamicMemberAccessOpPatcher) {
        this.patchDynamicMethodCall(this.fn);
      } else {
        this.patchNonMethodCall();
      }
      super.patchAsExpression();
    }
  }

  shouldPatchAsConditional(): boolean {
    return this.fn.isRepeatable() && !nodeContainsSoakOperation(this.fn.node);
  }

  patchAsConditional(): void {
    let soakContainer = findSoakContainer(this);
    this.fn.setRequiresRepeatableExpression();
    super.patchAsExpression();
    let fnCode = this.fn.getRepeatCode();

    let conditionCode = `typeof ${fnCode} === 'function'`;

    let callStartToken = this.getCallStartToken();
    this.remove(this.fn.outerEnd, callStartToken.start);
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

  /**
   * Change a.b?() to __guardMethod__(a, 'b', o => o.b())
   */
  patchMethodCall(fn: MemberAccessOpPatcher): void {
    let memberName = fn.getMemberName();
    if (fn.hasImplicitOperator()) {
      fn.setSkipImplicitDotCreation();
    }

    this.registerHelper('__guardMethod__', GUARD_METHOD_HELPER);
    this.addSuggestion(REMOVE_GUARD);
    if (fn instanceof SoakedMemberAccessOpPatcher) {
      fn.setShouldSkipSoakPatch();
    }

    let callStartToken = this.getCallStartToken();
    let soakContainer = findSoakContainer(this);
    let varName = soakContainer.claimFreeBinding('o');
    let prefix = this.slice(soakContainer.contentStart, this.fn.outerStart);
    if (prefix.length > 0) {
      this.remove(soakContainer.contentStart, this.fn.outerStart);
    }
    // Since memberName is always a valid identifier, we can put it in a string
    // literal without worrying about escaping.
    this.overwrite(
      fn.expression.outerEnd,
      callStartToken.end,
      `, '${memberName}', ${varName} => ${prefix}${varName}.${memberName}(`
    );
    soakContainer.insert(soakContainer.contentStart, '__guardMethod__(');
    soakContainer.appendDeferredSuffix(')');
  }

  /**
   * Change a[b]?() to __guardMethod__(a, b, (o, m) => o[m]())
   */
  patchDynamicMethodCall(fn: DynamicMemberAccessOpPatcher): void {
    let { expression, indexingExpr } = fn;

    this.registerHelper('__guardMethod__', GUARD_METHOD_HELPER);
    this.addSuggestion(REMOVE_GUARD);
    if (fn instanceof SoakedDynamicMemberAccessOpPatcher) {
      fn.setShouldSkipSoakPatch();
    }

    let callStartToken = this.getCallStartToken();
    let soakContainer = findSoakContainer(this);
    let objVarName = soakContainer.claimFreeBinding('o');
    let methodVarName = soakContainer.claimFreeBinding('m');
    let prefix = this.slice(soakContainer.contentStart, this.fn.outerStart);
    if (prefix.length > 0) {
      this.remove(soakContainer.contentStart, this.fn.outerStart);
    }
    this.overwrite(expression.outerEnd, indexingExpr.outerStart, `, `);
    this.overwrite(
      indexingExpr.outerEnd,
      callStartToken.end,
      `, (${objVarName}, ${methodVarName}) => ${prefix}${objVarName}[${methodVarName}](`
    );
    soakContainer.insert(soakContainer.contentStart, '__guardMethod__(');
    soakContainer.appendDeferredSuffix(')');
  }

  patchNonMethodCall(): void {
    this.registerHelper('__guardFunc__', GUARD_FUNC_HELPER);
    this.addSuggestion(REMOVE_GUARD);
    let callStartToken = this.getCallStartToken();
    let soakContainer = findSoakContainer(this);
    let varName = soakContainer.claimFreeBinding('f');
    let prefix = this.slice(soakContainer.contentStart, this.fn.outerStart);
    if (prefix.length > 0) {
      this.remove(soakContainer.contentStart, this.fn.outerStart);
    }
    this.overwrite(this.fn.outerEnd, callStartToken.end, `, ${varName} => ${prefix}${varName}(`);
    soakContainer.insert(soakContainer.contentStart, '__guardFunc__(');
    soakContainer.appendDeferredSuffix(')');
  }

  getCallStartToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.indexOfTokenMatchingPredicate(
      token => token.type === SourceType.CALL_START,
      this.fn.outerEndTokenIndex
    );
    if (!index || index.isAfter(this.contentEndTokenIndex)) {
      throw this.error(`unable to find open-paren for function call`);
    }
    return notNull(tokens.tokenAtIndex(index));
  }
}
