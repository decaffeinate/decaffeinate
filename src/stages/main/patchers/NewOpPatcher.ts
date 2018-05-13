import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

/**
 * Handles construction of objects with `new`.
 */
export default class NewOpPatcher extends FunctionApplicationPatcher {
  patchAsExpression(): void {
    let fnNeedsParens =
      !this.fn.isSurroundedByParentheses() &&
      !(this.fn instanceof IdentifierPatcher) &&
      !(this.fn instanceof MemberAccessOpPatcher);
    super.patchAsExpression({ fnNeedsParens });
  }
}
