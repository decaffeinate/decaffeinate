import NodePatcher from './NodePatcher.js';
import type { Node, ParseContext, Editor } from './types.js';

export default class DynamicMemberAccessOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this.indexingExpr = indexingExpr;
  }

  patchAsExpression() {
    this.expression.patch();
    this.indexingExpr.patch();
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * CoffeeScript considers dynamic member access repeatable if both parts
   * are themselves repeatable. So, for example, `a[0]` is repeatable because
   * both `a` and `0` are repeatable, but `a()[0]` and `a[b()]` are not.
   */
  isRepeatable(): boolean {
    return this.expression.isRepeatable() && this.indexingExpr.isRepeatable();
  }

  /**
   * We can make dynamic member access repeatable by making both parts
   * repeatable if they aren't already. We do that by giving them names and
   * referring to those names in a new dynamic member access. We cannot simply
   * save the value of the member access because this could be used as the LHS
   * of an assignment.
   */
  makeRepeatable(parens: boolean, ref: ?string=null): string {
    if (this.isRepeatable()) {
      return super.makeRepeatable(parens, ref);
    } else {
      let expression = this.expression.makeRepeatable(true, 'base');
      let indexingExpr = this.indexingExpr.makeRepeatable(false, 'name');
      return `${expression}[${indexingExpr}]`;
    }
  }
}
