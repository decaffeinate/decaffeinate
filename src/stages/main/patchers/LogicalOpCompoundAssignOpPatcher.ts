import { PatchOptions } from '../../../patchers/types';
import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

export default class LogicalOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression({ needsParens = false }: PatchOptions = {}): void {
    let shouldAddParens = this.negated || (needsParens && !this.isSurroundedByParentheses());
    if (this.negated) {
      this.insert(this.contentStart, '!');
    }
    if (shouldAddParens) {
      this.insert(this.contentStart, '(');
    }

    let operator = this.getOperatorToken();

    // `a &&= b` → `a && b`
    //    ^^^         ^^
    this.overwrite(operator.start, operator.end, this.isOrOp() ? `||` : `&&`);

    let assigneeAgain = this.assignee.patchRepeatable({ isForAssignment: true });

    // `a && b` → `a && (a = b`
    //                  ^^^^^
    this.insert(this.expression.outerStart, `(${assigneeAgain} = `);

    this.expression.patch();

    // `a && (a = b` → `a && (a = b)`
    //                             ^
    this.insert(this.expression.outerEnd, ')');

    if (shouldAddParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  patchAsStatement(options: PatchOptions = {}): void {
    if (this.lhsHasSoakOperation()) {
      this.patchAsExpression(options);
      return;
    }

    // `a &&= b` → `if (a &&= b`
    //              ^^^^
    this.insert(this.contentStart, 'if (');

    if (this.isOrOp()) {
      this.assignee.negate();
    }

    let assigneeAgain = this.assignee.patchRepeatable({ isForAssignment: true });

    // `if (a &&= b` → `if (a) { a = b`
    //       ^^^^^           ^^^^^^^^
    this.overwrite(this.assignee.outerEnd, this.expression.outerStart, `) { ${assigneeAgain} = `);

    this.expression.patch();

    // `if (a) { a = b` → `if (a) { a = b }`
    //                                   ^^
    this.insert(this.expression.outerEnd, ' }');
  }

  /**
   * @private
   */
  isOrOp(): boolean {
    let operator = this.getOperatorToken();
    let op = this.sourceOfToken(operator);
    // There could be a space in the middle of the operator, like `or =` or
    // `|| =`, and "op" will just be the first token in that case. So just check
    // the start of the operator.
    return op.substr(0, 2) === '||' || op.substr(0, 2) === 'or';
  }

  /**
   * We always start with an `if` statement, so no parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
