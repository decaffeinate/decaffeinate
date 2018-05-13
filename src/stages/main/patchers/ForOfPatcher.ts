import { SourceType } from 'coffee-lex';
import { ForOf } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import { CLEAN_UP_FOR_OWN_LOOPS } from '../../../suggestions';
import notNull from '../../../utils/notNull';
import ForPatcher from './ForPatcher';

export default class ForOfPatcher extends ForPatcher {
  node: ForOf;
  keyAssignee: NodePatcher;

  patchAsStatement(): void {
    if (this.body && !this.body.inline()) {
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
      this.insert(this.innerStart, `${this.getTargetReference()} = ${this.getTargetCode()}\n${this.getLoopIndent()}`);
    }

    let keyBinding = this.getIndexBinding();
    this.insert(keyAssignee.outerStart, '(');

    // Overwrite key assignee in case it was something like @key.
    this.overwrite(this.keyAssignee.contentStart, this.keyAssignee.contentEnd, keyBinding);

    // Patch the target. Also get a reference in case we need it.
    let targetReference = this.getTargetReference();

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
      this.addSuggestion(CLEAN_UP_FOR_OWN_LOOPS);
      if (shouldExtractTarget) {
        this.overwrite(relationToken.end, this.target.outerEnd, ` Object.keys(${targetReference} || {})) {`);
      } else {
        // `for (k of o` → `for (k of Object.keys(o`
        //                            ^^^^^^^^^^^^
        this.insert(this.target.outerStart, 'Object.keys(');

        // `for (k of Object.keys(o` → `for (k of Object.keys(o || {})) {`
        //                                                     ^^^^^^^^^^
        this.insert(this.target.outerEnd, ' || {})) {');
      }
    } else {
      if (shouldExtractTarget) {
        this.overwrite(relationToken.start, this.target.outerEnd, `in ${targetReference}) {`);
      } else {
        // `for (k of o` → `for (k in o`
        //         ^^              ^^
        this.overwrite(relationToken.start, relationToken.end, 'in');

        // `for (k in o` → `for (k in o) {`
        //                             ^^^
        this.insert(this.target.outerEnd, ') {');
      }
    }

    this.removeThenToken();
    this.patchPossibleNewlineAfterLoopHeader(this.target.outerEnd);
    if (valueAssignment !== null && this.body !== null) {
      this.body.insertLineBefore(valueAssignment, this.getOuterLoopBodyIndent());
    }
    this.patchBodyAndFilter();
  }

  removeOwnTokenIfExists(): void {
    if (this.node.isOwn) {
      let ownIndex = this.indexOfSourceTokenAfterSourceTokenIndex(this.contentStartTokenIndex, SourceType.OWN);
      if (!ownIndex) {
        throw this.error('Expected to find own token in for-own.');
      }
      let ownToken = notNull(this.sourceTokenAtIndex(ownIndex));
      this.remove(ownToken.start, this.keyAssignee.outerStart);
    }
  }

  requiresExtractingTarget(): boolean {
    return !this.target.isRepeatable() && this.valAssignee !== null;
  }

  targetBindingCandidate(): string {
    return 'object';
  }

  indexBindingCandidates(): Array<string> {
    return ['key'];
  }

  willPatchAsIIFE(): boolean {
    return this.willPatchAsExpression();
  }
}
