import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import traverse from '../../../utils/traverse';

export default class ExistsOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression() {
    let assigneeAgain;
    if (this.needsTypeofCheck()) {
      // `a ?= b` → `typeof a ?= b`
      //             ^^^^^^^
      this.insert(this.assignee.outerStart, `typeof `);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `typeof a ? b` → `typeof a !== 'undefined' && a !== null ? a ?= b`
      //                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.insert(
        this.assignee.outerEnd,
        ` !== 'undefined' && ${assigneeAgain} !== null ? ${assigneeAgain}`
      );
    } else {
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `a.b ?= b` → `a.b != null ? a.b ?= b`
      //                  ^^^^^^^^^^^^^^
      this.insert(this.assignee.outerEnd, ` != null ? ${assigneeAgain}`);
    }

    let operator = this.getOperatorToken();
    // `a.b != null ? a.b ?= b` → `a.b != null ? a.b : (a.b = b`
    //                    ^^                         ^^^^^^^^
    this.overwrite(operator.start, operator.end, `: (${assigneeAgain} =`);
    this.expression.patch();
    // `a.b != null ? a.b : (a.b = b` → `a.b != null ? a.b : (a.b = b)`
    //                                                               ^
    this.insert(this.expression.outerEnd, ')');
  }

  patchAsStatement() {
    if (this.lhsHasSoakOperation()) {
      this.patchAsExpression();
      return;
    }

    let assigneeAgain;
    if (this.needsTypeofCheck()) {
      // `a ?= b` → `if (typeof a ?= b`
      //             ^^^^^^^^^^^
      this.insert(this.assignee.outerStart, `if (typeof `);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `if (typeof a ?= b` → `if (typeof a === 'undefined' || a === null) { ?= b`
      //                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.insert(
        this.assignee.outerEnd,
        ` === 'undefined' || ${assigneeAgain} === null) {`
      );
    } else {
      // `a.b ?= b` → `if (a.b ?= b`
      //               ^^^^
      this.insert(this.assignee.outerStart, `if (`);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `if (a.b ?= b` → `if (a.b == null) { ?= b`
      //                          ^^^^^^^^^^^
      this.insert(this.assignee.outerEnd, ` == null) {`);
    }

    let operator = this.getOperatorToken();
    // `if (a.b == null) { ?= b` → `if (a.b == null) { a.b = b`
    //                     ^^                          ^^^^^
    this.overwrite(operator.start, operator.end, `${assigneeAgain} =`);
    this.expression.patch();
    // `if (a.b == null) { a.b = b` → `if (a.b == null) { a.b = b; }`
    //                                                           ^^^
    this.insert(this.expression.outerEnd, `; }`);
  }

  /**
   * Determine if we need to do `typeof a !== undefined && a !== null` rather
   * than just `a != null`. We need to emit the more defensive version if the
   * variable might not be declared.
   */
  needsTypeofCheck() {
    return this.assignee instanceof IdentifierPatcher &&
      !this.node.scope.hasBinding(this.assignee.node.data);
  }

  /**
   * If the left-hand side of the assignment has a soak operation, then there
   * may be a __guard__ call surrounding the whole thing, so we can't patch
   * statement code, so instead run the expression code path.
   */
  lhsHasSoakOperation() {
    let foundSoak = false;
    traverse(this.assignee.node, node => {
      if (foundSoak) {
        return false;
      }
      if (node.type === 'SoakedDynamicMemberAccessOp' ||
          node.type === 'SoakedFunctionApplication' ||
          node.type === 'SoakedMemberAccessOp') {
        foundSoak = true;
      }
    });
    return foundSoak;
  }

  /**
   * We'll always start with an `if` so we don't need parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
