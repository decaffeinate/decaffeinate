import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor, Token } from './types';

export default class MemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  patch() {
    this.expression.patch();
    if (this.hasImplicitDot()) {
      // `@a` → `@.a`
      //          ^
      this.insert(this.expression.after, '.');
    }
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
}
