import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';

export default class LogicalOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patch() {
    let operator = this.getOperatorToken();
    // `a &&= b` → `a && b`
    //      ^
    this.remove(operator.range[1] - '='.length, operator.range[1]);
    let assigneeAgain = this.assignee.makeRepeatable(false);
    this.assignee.patch();
    // `a && b` → `a && (a = b`
    //                  ^^^^^
    this.insert(this.expression.before, `(${assigneeAgain} = `);
    // `a && (a = b` → `a && (a = b)`
    //                             ^
    this.insert(this.expression.after, ')');
  }
}
