import { PatchOptions } from '../../../patchers/types';
import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

export default class FloorDivideOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    let shouldAddParens = this.negated || (needsParens && !this.isSurroundedByParentheses());
    if (this.negated) {
      this.insert(this.contentStart, '!');
    }
    if (shouldAddParens) {
      this.insert(this.contentStart, '(');
    }
    let assigneeAgain = this.assignee.patchRepeatable({ isForAssignment: true });

    // `a //= b` → `a = Math.floor(a / b`
    //               ^^^^^^^^^^^^^^^^^
    this.overwrite(this.assignee.outerEnd, this.expression.outerStart, ` = Math.floor(${assigneeAgain} / `);

    this.expression.patch({ needsParens: true });

    // `a = Math.floor(a / b` → `a = Math.floor(a / b)`
    //                                               ^
    this.insert(this.expression.outerEnd, ')');

    if (shouldAddParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  patchAsStatement(): void {
    this.patchAsExpression();
  }
}
