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

  patchAsStatement() {
    let bodyLinesToPrepend = [];
    let { keyAssignee } = this;

    let keyBinding = this.slice(keyAssignee.contentStart, keyAssignee.contentEnd);

    // `for k of o` → `for (k of o`
    //                     ^
    this.insert(keyAssignee.outerStart, '(');
    keyAssignee.patch();

    if (!(keyAssignee instanceof IdentifierPatcher)) {
      let keyAssigneeString = keyBinding;
      keyBinding = this.claimFreeBinding('key');
      // `for ([f, s] of o` → `for (key of o`
      //       ^^^^^^               ^^^
      this.overwrite(keyAssignee.contentStart, keyAssignee.contentEnd, keyBinding);
      bodyLinesToPrepend.push(`${keyAssigneeString} = ${keyBinding}`);
    }

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

    this.body.insertStatementsAtIndex(bodyLinesToPrepend, 0);
    this.body.patch({ leftBrace: false });
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
}
