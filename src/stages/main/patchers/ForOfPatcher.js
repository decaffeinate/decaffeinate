import ForPatcher from './ForPatcher.js';
import {OWN} from 'coffee-lex';

export default class ForOfPatcher extends ForPatcher {
  patchAsExpression() {
    throw this.error(
      `'for of' loops used as expressions are not yet supported ` +
      `(https://github.com/decaffeinate/decaffeinate/issues/156)`
    );
  }

  patchAsStatement() {
    let bodyLinesToPrepend = [];
    let { keyAssignee } = this;

    // Save the filter code and remove if it it's there.
    this.getFilterCode();
    if (this.filter) {
      this.remove(this.target.outerEnd, this.filter.outerEnd);
    }

    this.removeOwnTokenIfExists();

    if (this.requiresExtractingTarget()) {
      this.insert(this.outerStart, `${this.getTargetReference()} = ${this.getTargetCode()}\n${this.getIndent()}`);
    }

    let keyBinding = this.getIndexBinding();
    this.insert(keyAssignee.outerStart, '(');

    let { valAssignee } = this;

    this.overwrite(this.target.outerStart, this.target.outerEnd, this.getTargetReference());

    if (valAssignee) {
      valAssignee.patch();
      let valAssigneeString = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
      // `for (k, v of o` → `for (k of o`
      //        ^^^
      this.remove(keyAssignee.outerEnd, valAssignee.outerEnd);

      let valueAssignmentStatement = `${valAssigneeString} = ${this.getTargetReference()}[${keyBinding}]`;

      if (valAssignee.statementNeedsParens()) {
        valueAssignmentStatement = `(${valueAssignmentStatement})`;
      }

      bodyLinesToPrepend.push(valueAssignmentStatement);
    }

    let relationToken = this.getRelationToken();
    if (this.node.isOwn) {
      // `for (k of o` → `for (k of Object.keys(o`
      //                            ^^^^^^^^^^^^
      this.insert(this.target.outerStart, 'Object.keys(');

      // `for (k of o` → `for (k of Object.keys(o)) {`
      //                                         ^^^^
      this.insert(this.target.outerEnd, ')) {');
    } else {
      // `for (k of o` → `for (k in o`
      //         ^^              ^^
      this.overwrite(relationToken.start, relationToken.end, 'in');

      // `for (k in o` → `for (k in o) {`
      //                             ^^^
      this.insert(this.target.outerEnd, ') {');
    }

    this.removeThenToken();
    this.body.insertStatementsAtIndex(bodyLinesToPrepend, 0);
    this.patchBodyAndFilter();
  }

  removeOwnTokenIfExists() {
    if (this.node.isOwn) {
      let ownIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        this.contentStartTokenIndex,
        OWN
      );
      let ownToken = this.sourceTokenAtIndex(ownIndex);
      this.remove(ownToken.start, this.keyAssignee.outerStart);
    }
  }

  requiresExtractingTarget() {
    return !this.target.isRepeatable() && this.valAssignee;
  }

  targetBindingCandidate() {
    return 'object';
  }

  indexBindingCandidates(): Array<string> {
    return ['key'];
  }
}
