import CompoundAssignOpPatcher from './CompoundAssignOpPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';

export default class ExistsOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression() {
    let assigneeAgain;
    if (this.assignee instanceof IdentifierPatcher) {
      // `a ?= b` → `typeof a ?= b`
      //             ^^^^^^^
      this.insert(this.assignee.before, `typeof `);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `typeof a ? b` → `typeof a !== 'undefined' && a !== null ? a ?= b`
      //                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.insert(
        this.assignee.after,
        ` !== 'undefined' && ${assigneeAgain} !== null ? ${assigneeAgain}`
      );
    } else {
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `a.b ?= b` → `a.b != null ? a.b ?= b`
      //                  ^^^^^^^^^^^^^^
      this.insert(this.assignee.after, ` != null ? ${assigneeAgain}`);
    }

    let operator = this.getOperatorToken();
    // `a.b != null ? a.b ?= b` → `a.b != null ? a.b : (a.b = b`
    //                    ^^                         ^^^^^^^^
    this.overwrite(...operator.range, `: (${assigneeAgain} =`);
    this.expression.patch();
    // `a.b != null ? a.b : (a.b = b` → `a.b != null ? a.b : (a.b = b)`
    //                                                               ^
    this.insert(this.expression.after, ')');
  }

  patchAsStatement() {
    let assigneeAgain;
    if (this.assignee instanceof IdentifierPatcher) {
      // `a ?= b` → `if (typeof a ?= b`
      //             ^^^^^^^^^^^
      this.insert(this.assignee.before, `if (typeof `);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `if (typeof a ?= b` → `if (typeof a === 'undefined' || a === null) { ?= b`
      //                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      this.insert(
        this.assignee.after,
        ` === 'undefined' || ${assigneeAgain} === null) {`
      );
    } else {
      // `a.b ?= b` → `if (a.b ?= b`
      //               ^^^^
      this.insert(this.assignee.before, `if (`);
      this.assignee.patch();
      assigneeAgain = this.assignee.makeRepeatable();
      // `if (a.b ?= b` → `if (a.b == null) { ?= b`
      //                          ^^^^^^^^^^^
      this.insert(this.assignee.after, ` == null) {`);
    }

    let operator = this.getOperatorToken();
    // `if (a.b == null) { ?= b` → `if (a.b == null) { a.b = b`
    //                     ^^                          ^^^^^
    this.overwrite(...operator.range, `${assigneeAgain} =`);
    this.expression.patch();
    // `if (a.b == null) { a.b = b` → `if (a.b == null) { a.b = b; }`
    //                                                           ^^^
    this.insert(this.expression.after, `; }`);
  }
}
