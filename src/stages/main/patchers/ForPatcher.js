import NodePatcher from './../../../patchers/NodePatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Node, ParseContext, Editor, SourceToken } from './../../../patchers/types.js';
import { RELATION, THEN } from 'coffee-lex';

export default class ForPatcher extends NodePatcher {
  keyAssignee: ?NodePatcher;
  valAssignee: ?NodePatcher;
  target: NodePatcher;
  filter: ?NodePatcher;
  body: BlockPatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(node, context, editor);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
    this.body = body;
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
      filter.patch();
      this._filterCode = this.slice(filter.contentStart, filter.contentEnd);
    }
    return this._filterCode;
  }

  patchBodyAndFilter() {
    let {body, filter} = this;
    if (filter) {
      body.insertStatementsAtIndex([`if (${this.getFilterCode()}) {`], 0);
      body.patch({ leftBrace: false, rightBrace: false });
      body.indent();
      body.appendLineAfter('}', -1);
      body.appendLineAfter('}', -2);
    } else {
      body.patch({ leftBrace: false });
    }
  }

  getRelationToken(): SourceToken {
    let tokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.keyAssignee || this.valAssignee, this.target,
      token => token.type === RELATION
    );
    if (!tokenIndex) {
      throw this.error(`cannot find relation keyword in 'for' loop`);
    }
    return this.sourceTokenAtIndex(tokenIndex);
  }

  statementNeedsSemicolon(): boolean {
    return false;
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
      token => token.type === THEN
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
      this.target.patch();
      if (this.requiresExtractingTarget()) {
        this._targetReference = this.claimFreeBinding(this.targetBindingCandidate());
      } else {
        this._targetReference = this.slice(this.target.contentStart, this.target.contentEnd);
      }
    }
    return this._targetReference;
  }
}
