import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

/**
 * Patcher for ?= that translates to native ES2021 ??= nullish coalescing
 * assignment.
 */
export default class NullishCoalescingCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression(): void {
    super.patchAsExpression();
    this.patchOperator();
  }

  patchAsStatement(): void {
    super.patchAsStatement();
    this.patchOperator();
  }

  patchOperator(): void {
    const operator = this.getOperatorToken();
    this.overwrite(operator.start, operator.end, '??=');
  }
}
