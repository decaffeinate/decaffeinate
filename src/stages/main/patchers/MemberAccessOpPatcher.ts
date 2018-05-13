import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import { MemberAccessOp } from 'decaffeinate-parser/dist/nodes';
import { PatcherContext, PatchOptions, RepeatableOptions } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import IdentifierPatcher from './IdentifierPatcher';

export default class MemberAccessOpPatcher extends NodePatcher {
  node: MemberAccessOp;
  expression: NodePatcher;
  member: IdentifierPatcher;
  _skipImplicitDotCreation: boolean;

  constructor(patcherContext: PatcherContext, expression: NodePatcher, member: IdentifierPatcher) {
    super(patcherContext);
    this.expression = expression;
    this.member = member;
    this._skipImplicitDotCreation = false;
  }

  initialize(): void {
    this.expression.setRequiresExpression();
  }

  setSkipImplicitDotCreation(): void {
    this._skipImplicitDotCreation = true;
  }

  patchAsExpression(): void {
    if (this.lhsNeedsParens()) {
      this.insert(this.expression.outerStart, '(');
    }
    this.expression.patch();
    if (this.lhsNeedsParens()) {
      this.insert(this.expression.outerEnd, ')');
    }
    if (this.hasImplicitOperator() && !this._skipImplicitDotCreation) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.outerEnd, '.');
    }
  }

  /**
   * We can make member accesses repeatable by making the base expression
   * repeatable if it isn't already.
   */
  patchAsRepeatableExpression(repeatableOptions: RepeatableOptions = {}, patchOptions: PatchOptions = {}): string {
    // eslint-disable-line no-unused-vars
    if (repeatableOptions.isForAssignment) {
      this.expression.setRequiresRepeatableExpression({ isForAssignment: true, parens: true, ref: 'base' });
      this.patchAsExpression();
      this.commitDeferredSuffix();
      return `${this.expression.getRepeatCode()}.${this.getFullMemberName()}`;
    } else {
      return super.patchAsRepeatableExpression(repeatableOptions, patchOptions);
    }
  }

  hasImplicitOperator(): boolean {
    return !this.getMemberOperatorSourceToken();
  }

  getMemberOperatorSourceToken(): SourceToken | null {
    let dotIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.expression.outerEnd,
      this.outerEnd - 1,
      token => token.type === SourceType.DOT
    );

    if (!dotIndex) {
      let firstIndex = this.contentStartTokenIndex;
      let firstToken = notNull(this.sourceTokenAtIndex(firstIndex));
      if (firstToken.type === SourceType.AT) {
        // e.g. `@a`, so it's okay that there's no dot
        return null;
      }

      throw this.error(`cannot find '.' in member access`);
    }

    // e.g. `a.b`
    return this.sourceTokenAtIndex(dotIndex);
  }

  getMemberName(): string {
    return this.node.member.data;
  }

  getFullMemberName(): string {
    return this.getMemberName();
  }

  getMemberNameSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.lastIndexOfTokenMatchingPredicate(
      token => token.type === SourceType.IDENTIFIER,
      this.contentEndTokenIndex
    );
    if (!index || index.isBefore(this.contentStartTokenIndex)) {
      throw this.error(`unable to find member name token in access`);
    }
    return notNull(tokens.tokenAtIndex(index));
  }

  /**
   * Member access is repeatable (in CoffeeScript) if the expression we're
   * accessing a member of is also repeatable. Technically speaking even this is
   * not safe since member access can have side-effects via getters and setters,
   * but this is the way the official CoffeeScript compiler works so we follow
   * suit.
   */
  isRepeatable(): boolean {
    return this.expression.isRepeatable();
  }

  /**
   * If `BASE` needs parens, then `BASE.MEMBER` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }

  lhsNeedsParens(): boolean {
    return this.expression.node.type === 'Int';
  }
}
