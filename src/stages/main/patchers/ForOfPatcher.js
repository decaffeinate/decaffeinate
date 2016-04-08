import ForPatcher from './ForPatcher.js';

export default class ForOfPatcher extends ForPatcher {
  patchAsStatement() {
    if (this.node.isOwn) {
      throw this.error(
        `'for own' is not supported yet ` +
        ` (https://github.com/decaffeinate/decaffeinate/issues/157)`
      );
    }

    let bodyLinesToPrepend = [];
    let { keyAssignee } = this;

    let keyBinding = this.getIndexBinding();
    this.insert(keyAssignee.outerStart, '(');

    let { valAssignee } = this;

    if (valAssignee) {
      valAssignee.patch();
      let valAssigneeString = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
      // `for (k, v of o` → `for (k of o`
      //        ^^^
      this.remove(keyAssignee.outerEnd, valAssignee.outerEnd);

      this.target.patch();
      let targetAgain = this.target.makeRepeatable(true, 'iterable');

      let valueAssignmentStatement = `${valAssigneeString} = ${targetAgain}[${keyBinding}]`;

      if (valAssignee.statementNeedsParens()) {
        valueAssignmentStatement = `(${valueAssignmentStatement})`;
      }

      bodyLinesToPrepend.push(valueAssignmentStatement);
    } else {
      this.target.patch();
    }

    let relationToken = this.getRelationToken();
    // `for (k of o` → `for (k in o`
    //         ^^              ^^
    this.overwrite(relationToken.start, relationToken.end, 'in');

    // `for (k in o` → `for (k in o)`
    //                             ^
    this.insert(this.target.outerEnd, ') {');

    this.removeThenToken();
    this.body.insertStatementsAtIndex(bodyLinesToPrepend, 0);
    this.body.patch({ leftBrace: false });
  }

  indexBindingCandidates(): Array<string> {
    return ['key'];
  }
}
