import CompoundAssignOpPatcher from './CompoundAssignOpPatcher.js';

export default class LogicalOpCompoundAssignOpPatcher extends CompoundAssignOpPatcher {
  patchAsExpression() {
    let operator = this.getOperatorToken();
    // `a &&= b` → `a && b`
    //      ^
    this.remove(operator.end - '='.length, operator.end);
    let assigneeAgain = this.assignee.makeRepeatable(false);
    this.assignee.patch();
    // `a && b` → `a && (a = b`
    //                  ^^^^^
    this.insert(this.expression.outerStart, `(${assigneeAgain} = `);
    // `a && (a = b` → `a && (a = b)`
    //                             ^
    this.insert(this.expression.outerEnd, ')');
  }

  patchAsStatement() {
    let operator = this.getOperatorToken();
    let op = this.context.source.slice(operator.start, operator.end);

    // `a &&= b` → `if (a &&= b`
    //              ^^^^
    this.insert(this.contentStart, 'if (');

    if (op === '||=') {
      this.assignee.negate();
    }

    let assigneeAgain = this.assignee.makeRepeatable(false);
    this.assignee.patch();

    // `if (a &&= b` → `if (a) { a = b`
    //       ^^^^^           ^^^^^^^^
    this.overwrite(this.assignee.outerEnd, this.expression.outerStart, `) { ${assigneeAgain} = `);

    // `if (a) { a = b` → `if (a) { a = b }`
    //                                   ^^
    this.insert(this.expression.outerEnd, ' }');
  }
}
