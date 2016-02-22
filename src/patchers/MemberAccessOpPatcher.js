import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor, Token } from './types';

export default class MemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  patchAsExpression() {
    this.expression.patch();
    if (this.hasImplicitDot()) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.after, '.');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  hasImplicitDot(): boolean {
    return !this.expression.hasTokenAfter('.');
  }

  getMemberName(): string {
    return this.node.memberName;
  }

  getMemberNameToken(): Token {
    let tokenOffset = this.hasImplicitDot() ? /* NAME */ 1 : /* DOT NAME */ 2;
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
      return `${expression}.${this.getMemberName()}`;
    }
  }
}
