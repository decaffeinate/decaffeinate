import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { PatcherContext } from '../../../patchers/types';
import getAssigneeBindings from '../../../utils/getAssigneeBindings';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import LoopPatcher from './LoopPatcher';

export default abstract class ForPatcher extends LoopPatcher {
  keyAssignee: NodePatcher | null;
  valAssignee: NodePatcher | null;
  target: NodePatcher;
  filter: NodePatcher | null;

  _filterCode: string | null = null;
  _targetCode: string | null = null;
  _indexBinding: string | null = null;
  _targetReference: string | null = null;

  constructor(
      patcherContext: PatcherContext, keyAssignee: NodePatcher | null,
      valAssignee: NodePatcher | null, target: NodePatcher,
      filter: NodePatcher | null, body: BlockPatcher) {
    super(patcherContext, body);
    this.keyAssignee = keyAssignee;
    this.valAssignee = valAssignee;
    this.target = target;
    this.filter = filter;
  }

  initialize(): void {
    super.initialize();
    if (this.keyAssignee) {
      this.keyAssignee.setAssignee();
      this.keyAssignee.setRequiresExpression();
    }
    if (this.valAssignee) {
      this.valAssignee.setAssignee();
      this.valAssignee.setRequiresExpression();
    }
    this.target.setRequiresExpression();
    if (this.filter) {
      this.filter.setRequiresExpression();
    }
  }

  /**
   * Called by the BlockPatcher for the enclosing scope to know which
   * assignments may need declarations at the start of the block.
   */
  getIIFEAssignments(): Array<string> {
    if (this.willPatchAsIIFE()) {
      let iifeAssignments = [];
      if (this.keyAssignee) {
        iifeAssignments.push(...getAssigneeBindings(this.keyAssignee.node));
      }
      if (this.valAssignee) {
        iifeAssignments.push(...getAssigneeBindings(this.valAssignee.node));
      }
      return iifeAssignments;
    } else {
      return [];
    }
  }

  getFilterCode(): string | null {
    let filter = this.filter;
    if (!filter) {
      return null;
    }
    if (!this._filterCode) {
      this._filterCode = filter.patchAndGetCode({ needsParens: false });
    }
    return this._filterCode;
  }

  getLoopBodyIndent(): string {
    if (this.filter) {
      return this.getOuterLoopBodyIndent() + this.getProgramIndentString();
    } else {
      return this.getOuterLoopBodyIndent();
    }
  }

  patchBodyAndFilter(): void {
    if (this.body) {
      if (this.filter) {
        this.body.insertLineBefore(`if (${this.getFilterCode()}) {`, this.getOuterLoopBodyIndent());
        this.patchBody();
        this.body.insertLineAfter('}', this.getOuterLoopBodyIndent());
        this.body.insertLineAfter('}', this.getLoopIndent());
      } else {
        this.patchBody();
        this.body.insertLineAfter('}', this.getLoopIndent());
      }
    } else {
      if (this.filter) {
        this.insert(this.contentEnd, `if (${this.getFilterCode()}) {} }`);
      } else {
        this.insert(this.contentEnd, `}`);
      }
    }
  }

  getRelationToken(): SourceToken {
    let tokenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      notNull(this.keyAssignee || this.valAssignee), this.target,
      token => token.type === SourceType.RELATION
    );
    if (!tokenIndex) {
      throw this.error(`cannot find relation keyword in 'for' loop`);
    }
    return notNull(this.sourceTokenAtIndex(tokenIndex));
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
  removeThenToken(): void {
    let searchStart = this.getLoopHeaderEnd();
    let searchEnd;
    if (this.body) {
      searchEnd = this.body.outerStart;
    } else {
      let nextToken = this.nextSemanticToken();
      if (nextToken) {
        searchEnd = nextToken.end;
      } else {
        searchEnd = this.contentEnd;
      }
    }
    let index = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart, searchEnd, token => token.type === SourceType.THEN
    );
    if (index) {
      let thenToken = notNull(this.sourceTokenAtIndex(index));
      let nextIndex = index.next();
      let nextToken = nextIndex && this.sourceTokenAtIndex(nextIndex);
      if (nextToken) {
        this.remove(thenToken.start, nextToken.start);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }
  }

  /**
   * Get the last known index of the loop header, just before the `then` token
   * or the body. This can be overridden to account for additional loop header
   * elements.
   */
  getLoopHeaderEnd(): number {
    return Math.max(
      this.filter ? this.filter.outerEnd : -1,
      this.target.outerEnd,
    );
  }

  getTargetCode(): string {
    this.computeTargetCodeIfNecessary();
    return notNull(this._targetCode);
  }

  getTargetReference(): string {
    this.computeTargetCodeIfNecessary();
    return notNull(this._targetReference);
  }

  computeTargetCodeIfNecessary(): void {
    if (!this._targetReference || !this._targetCode) {
      this._targetCode = this.target.patchAndGetCode();
      if (this.requiresExtractingTarget()) {
        this._targetReference = this.claimFreeBinding(this.targetBindingCandidate());
      } else {
        this._targetReference = this._targetCode;
      }
    }
  }

  abstract requiresExtractingTarget(): boolean;
  abstract targetBindingCandidate(): string;
}
