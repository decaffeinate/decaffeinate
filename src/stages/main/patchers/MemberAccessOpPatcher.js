import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor, Token } from './../../../patchers/types.js';

export default class MemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  patchAsExpression() {
    this.expression.patch();
    if (this.isShorthandPrototype()) {
      // `a::` → `a.prototype`
      //   ^^      ^^^^^^^^^^
      let operator = this.getMemberOperatorToken();
      this.overwrite(...operator.range, '.prototype');
    }
    if (this.hasImplicitOperator()) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.after, '.');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  hasImplicitOperator(): boolean {
    return !this.getMemberOperatorToken();
  }

  isShorthandPrototype(): boolean {
    let token = this.getMemberOperatorToken();
    return token ? token.type === '::' : false;
  }

  getMemberOperatorToken(): ?Token {
    let lastToken = this.context.tokenAtIndex(this.afterTokenIndex);
    if (lastToken.type === '::') {
      return lastToken;
    } else {
      let penultimateToken = this.context.tokenAtIndex(this.afterTokenIndex - 1);
      if (penultimateToken.type === '@') {
        return null;
      }
      if (penultimateToken.type !== '.') {
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

  getMemberNameToken(): Token {
    let tokenOffset = this.hasImplicitOperator() ? /* NAME */ 1 : /* DOT NAME */ 2;
    return this.context.tokenAtIndex(this.expression.afterTokenIndex + tokenOffset);
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
  makeRepeatable(parens: boolean, ref: ?string=null) {
    if (this.isRepeatable()) {
      return super.makeRepeatable(parens, ref);
    } else {
      let expression = this.expression.makeRepeatable(true, 'base');
      return `${expression}.${this.getFullMemberName()}`;
    }
  }
}
