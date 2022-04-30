import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

/**
 * Patcher for ?= that translates to native ES2021 ??= nullish coalescing
 * assignment.
 */
export default class NullishCoalescingCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression(): void {
    this.patchOperator();
    super.patchAsExpression();
  }

  patchAsStatement(): void {
    this.patchOperator();
    super.patchAsStatement();
  }

  patchOperator(): void {
    const operator = this.getOperatorToken();
    this.overwrite(operator.start, operator.end, '??=');
  }
}
