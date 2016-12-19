import NodePatcher from './../../../patchers/NodePatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import LoopPatcher from './LoopPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { PatcherContext, SourceToken } from './../../../patchers/types.js';
import { SourceType } from 'coffee-lex';

export default class ForPatcher extends LoopPatcher {
  keyAssignee: ?NodePatcher;
  valAssignee: ?NodePatcher;
  target: NodePatcher;
  filter: ?NodePatcher;

  constructor(patcherContext: PatcherContext, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(patcherContext, body);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
  }

  initialize() {
    if (this.keyAssignee) {
      this.keyAssignee.setRequiresExpression();
    }
    if (this.valAssignee) {
      this.valAssignee.setRequiresExpression();
    }
    this.target.setRequiresExpression();
    if (this.filter) {
      this.filter.setRequiresExpression();
    }
  }

  getFilterCode(): ?string {
    let filter = this.filter;
    if (!filter) {
      return null;
    }
    if (!this._filterCode) {
      this._filterCode = filter.patchAndGetCode({ needsParens: false });
    }
    return this._filterCode;
  }

  getLoopBodyIndent() {
    if (this.filter) {
      return this.getOuterLoopBodyIndent() + this.getProgramIndentString();
    } else {
      return this.getOuterLoopBodyIndent();
    }
  }

  patchBodyAndFilter() {
    let {body, filter} = this;

    if (filter) {
      this.body.insertLineBefore(`if (${this.getFilterCode()}) {`, this.getOuterLoopBodyIndent());
      this.patchBodyWithPossibleItemVariable();
      body.insertLineAfter('}', this.getOuterLoopBodyIndent());
      body.insertLineAfter('}', this.getLoopIndent());
    } else {
      this.patchBodyWithPossibleItemVariable();
      body.insertLineAfter('}', this.getLoopIndent());
    }
  }

  getRelationToken(): SourceToken {
    let tokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.keyAssignee || this.valAssignee, this.target,
      token => token.type === SourceType.RELATION
    );
    if (!tokenIndex) {
      throw this.error(`cannot find relation keyword in 'for' loop`);
    }
    return this.sourceTokenAtIndex(tokenIndex);
  }

  /**
   * @protected
   */
  getIndexBinding(): string {
    if (!this._indexBinding) {
      this._indexBinding = this.computeIndexBinding();
    }
    return this._indexBinding;
  }

  /**
   * @protected
   */
  computeIndexBinding(): string {
    let keyAssignee = this.keyAssignee;
    if (keyAssignee) {
      if (!(keyAssignee instanceof IdentifierPatcher)) {
        // CoffeeScript requires that the index be an identifier, not a pattern
        // matching expression, so this should never happen.
        throw keyAssignee.error(`expected loop index to be an identifier`);
      }
      return this.slice(keyAssignee.contentStart, keyAssignee.contentEnd);
    } else {
      return this.claimFreeBinding(this.indexBindingCandidates());
    }
  }

  /**
   * @protected
   */
  indexBindingCandidates(): Array<string> {
    return ['i', 'j', 'k'];
  }

  /**
   * @protected
   */
  removeThenToken() {
    let index = this.indexOfSourceTokenBetweenPatchersMatching(
      this.target, this.body,
      token => token.type === SourceType.THEN
    );
    if (index) {
      let thenToken = this.sourceTokenAtIndex(index);
      let nextToken = this.sourceTokenAtIndex(index.next());
      this.remove(thenToken.start, nextToken.start);
    }
  }

  getTargetCode(): string {
    // Trigger patching the reference.
    this.getTargetReference();
    return this.slice(this.target.contentStart, this.target.contentEnd);
  }

  getTargetReference(): string {
    if (!this._targetReference) {
      if (this.requiresExtractingTarget()) {
        this.target.patch();
        this._targetReference = this.claimFreeBinding(this.targetBindingCandidate());
      } else {
        this._targetReference = this.target.patchAndGetCode();
      }
    }
    return this._targetReference;
  }
}
