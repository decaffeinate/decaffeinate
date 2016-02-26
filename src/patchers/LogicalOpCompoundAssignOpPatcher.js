import CompoundAssignOpPatcher from './CompoundAssignOpPatcher.js';

export default class LogicalOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression() {
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

  patchAsStatement() {
    let operator = this.getOperatorToken();
    let op = this.context.source.slice(...operator.range);

    // `a &&= b` → `if (a &&= b`
    //              ^^^^
    this.insertBefore('if (');

    if (op === '||=') {
      this.assignee.negate();
    }

    let assigneeAgain = this.assignee.makeRepeatable(false);
    this.assignee.patch();

    // `if (a &&= b` → `if (a) { a = b`
    //       ^^^^^           ^^^^^^^^
    this.overwrite(this.assignee.after, this.expression.before, `) { ${assigneeAgain} = `);

    // `if (a) { a = b` → `if (a) { a = b }`
    //                                   ^^
    this.insert(this.expression.after, ' }');
  }
}
