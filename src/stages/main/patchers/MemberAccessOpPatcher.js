import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor, SourceToken } from './../../../patchers/types.js';
import { AT, DOT, IDENTIFIER, PROTO } from 'coffee-lex';

export default class MemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  patchAsExpression() {
    this.expression.patch();
    if (this.isShorthandPrototype()) {
      // `a::` → `a.prototype`
      //   ^^      ^^^^^^^^^^
      let operator = this.getMemberOperatorSourceToken();
      this.overwrite(operator.start, operator.end, '.prototype');
    }
    if (this.hasImplicitOperator()) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.outerEnd, '.');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  hasImplicitOperator(): boolean {
    return !this.getMemberOperatorSourceToken();
  }

  isShorthandPrototype(): boolean {
    let token = this.getMemberOperatorSourceToken();
    return token ? token.type === PROTO : false;
  }

  getMemberOperatorSourceToken(): ?SourceToken {
    let tokens = this.context.sourceTokens;
    let lastIndex = this.contentEndTokenIndex;
    let lastToken = tokens.tokenAtIndex(lastIndex);
    if (lastToken.type === PROTO) {
      return lastToken;
    } else {
      let penultimateIndex = lastIndex.previous();
      let penultimateToken = tokens.tokenAtIndex(penultimateIndex);
      if (penultimateToken.type === AT) {
        return null;
      }
      if (penultimateToken.type !== DOT) {
        throw this.error(`cannot find '.' in member access`);
      }
      return penultimateToken;
    }
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
}
