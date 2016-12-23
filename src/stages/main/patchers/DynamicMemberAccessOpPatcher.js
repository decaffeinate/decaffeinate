import NodePatcher from './../../../patchers/NodePatcher';
import type { RepeatableOptions, PatcherContext } from './../../../patchers/types';

export default class DynamicMemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;
  indexingExpr: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
    this.indexingExpr = indexingExpr;
  }

  initialize() {
    this.expression.setRequiresExpression();
    this.indexingExpr.setRequiresExpression();
  }

  patchAsExpression() {
    this.expression.patch();
    this.indexingExpr.patch();
  }

  /**
   * We can make dynamic member access repeatable by making both parts
   * repeatable if they aren't already. We do that by giving them names and
   * referring to those names in a new dynamic member access. We cannot simply
   * save the value of the member access because this could be used as the LHS
   * of an assignment.
   */
  patchAsRepeatableExpression(repeatableOptions: RepeatableOptions={}, patchOptions={}): string {  // eslint-disable-line no-unused-vars
    this.expression.setRequiresRepeatableExpression({ parens: true, ref: 'base' });
    this.indexingExpr.setRequiresRepeatableExpression({ ref: 'name' });
    this.patchAsExpression();
    return `${this.expression.getRepeatCode()}[${this.indexingExpr.getRepeatCode()}]`;
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
   * If `BASE` needs parens, then `BASE[INDEX]` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }
}
