import ForPatcher from './ForPatcher.js';
import {OWN} from 'coffee-lex';

export default class ForOfPatcher extends ForPatcher {
  patchAsStatement() {
    if (!this.body.inline()) {
      this.body.setIndent(this.getLoopBodyIndent());
    }

    let { keyAssignee } = this;

    // Save the filter code and remove if it it's there.
    this.getFilterCode();
    if (this.filter) {
      this.remove(this.target.outerEnd, this.filter.outerEnd);
    }

    this.removeOwnTokenIfExists();

    let shouldExtractTarget = this.requiresExtractingTarget();
    if (shouldExtractTarget) {
      this.insert(
        this.innerStart,
        `${this.getTargetReference()} = ${this.getTargetCode()}\n${this.getLoopIndent()}`
      );
    }

    let keyBinding = this.getIndexBinding();
    this.insert(keyAssignee.outerStart, '(');

    // Patch the target. Also get a reference in case we need it.
    let targetReference = this.getTargetReference();
    if (shouldExtractTarget) {
      this.overwrite(this.target.outerStart, this.target.outerEnd, targetReference);
    }

    let { valAssignee } = this;

    let valueAssignment = null;
    if (valAssignee) {
      valAssignee.patch();
      let valAssigneeString = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
      // `for (k, v of o` → `for (k of o`
      //        ^^^
      this.remove(keyAssignee.outerEnd, valAssignee.outerEnd);

      valueAssignment = `${valAssigneeString} = ${this.getTargetReference()}[${keyBinding}]`;

      if (valAssignee.statementNeedsParens()) {
        valueAssignment = `(${valueAssignment})`;
      }
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
    this.patchPossibleNewlineAfterLoopHeader(this.target.outerEnd);
    if (valueAssignment !== null) {
      this.body.insertLineBefore(valueAssignment, this.getOuterLoopBodyIndent());
    }
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

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression();
  }
}

