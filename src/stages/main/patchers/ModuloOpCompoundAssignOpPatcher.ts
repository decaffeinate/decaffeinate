import { PatchOptions } from '../../../patchers/types';
import registerModHelper from '../../../utils/registerModHelper';
import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

export default class ModuloOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    let helper = registerModHelper(this);

    let shouldAddParens = this.negated || (needsParens && !this.isSurroundedByParentheses());
    if (this.negated) {
      this.insert(this.contentStart, '!');
    }
    if (shouldAddParens) {
      this.insert(this.contentStart, '(');
    }

    let assigneeAgain = this.assignee.patchRepeatable({ isForAssignment: true });

    // `a %%= b` → `a %%= __mod__(a, b`
    //               ^^^^^^^^^^^^^^^^
    this.overwrite(this.assignee.outerEnd, this.expression.outerStart, ` = ${helper}(${assigneeAgain}, `);

    this.expression.patch();

    // `a %%= __mod__(a, b` → `a %%= __mod__(a, b)`
    //                                           ^
    this.insert(this.expression.outerEnd, ')');

    if (shouldAddParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  patchAsStatement(): void {
    this.patchAsExpression();
  }
}
