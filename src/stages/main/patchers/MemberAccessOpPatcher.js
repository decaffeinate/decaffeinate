import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor, SourceToken } from './../../../patchers/types.js';
import { AT, DOT, IDENTIFIER, PROTO } from 'coffee-lex';

export default class MemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;
  _skipImplicitDotCreation: boolean;

  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this._skipImplicitDotCreation = false;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  setSkipImplicitDotCreation() {
    this._skipImplicitDotCreation = true;
  }

  patchAsExpression() {
    this.expression.patch();
    if (this.isShorthandPrototype()) {
      // `a::` → `a.prototype`
      //   ^^      ^^^^^^^^^^
      let operator = this.getMemberOperatorSourceToken();
      this.overwrite(operator.start, operator.end, '.prototype');
    }
    if (this.hasImplicitOperator() && !this._skipImplicitDotCreation) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.outerEnd, '.');
    }
  }

  hasImplicitOperator(): boolean {
    return !this.getMemberOperatorSourceToken();
  }

  isShorthandPrototype(): boolean {
    let token = this.getMemberOperatorSourceToken();
    return token ? token.type === PROTO : false;
  }

  getMemberOperatorSourceToken(): ?SourceToken {
    let lastIndex = this.contentEndTokenIndex;
    let lastToken = this.sourceTokenAtIndex(lastIndex);

    if (lastToken.type === PROTO) {
      // e.g. `a::`
      return lastToken;
    }

    let dotIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
      this.expression.outerEndTokenIndex,
      DOT
    );

    if (!dotIndex) {
      let firstIndex = this.contentStartTokenIndex;
      let firstToken = this.sourceTokenAtIndex(firstIndex);

      if (firstToken.type === AT) {
        // e.g. `@a`, so it's okay that there's no dot
        return null;
      }

      throw this.error(`cannot find '.' in member access`);
    }

    // e.g. `a.b`
    return this.sourceTokenAtIndex(dotIndex);
  }

  getMemberName(): string {
    return this.node.memberName;
  }

  getFullMemberName(): string {
    return this.getMemberName();
  }

  getMemberNameSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.lastIndexOfTokenMatchingPredicate(
      token => token.type === IDENTIFIER,
      this.contentEndTokenIndex
    );
    if (!index || index.isBefore(this.contentStartTokenIndex)) {
      throw this.error(`unable to find member name token in access`);
    }
    return tokens.tokenAtIndex(index);
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
   * We can make member accesses repeatable by making the base expression
   * repeatable if it isn't already.
   */
  makeRepeatable(parens: boolean, ref: ?string=null) { // eslint-disable-line no-unused-vars
    let expression = this.expression.makeRepeatable(true, 'base');
    return `${expression}.${this.getFullMemberName()}`;
  }

  /**
   * If `BASE` needs parens, then `BASE.MEMBER` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }
}
