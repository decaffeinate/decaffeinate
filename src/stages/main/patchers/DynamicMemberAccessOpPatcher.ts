import {
  PatcherContext, PatchOptions, RepeatableOptions
} from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';

export default class DynamicMemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;
  indexingExpr: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher, indexingExpr: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
    this.indexingExpr = indexingExpr;
  }

  initialize(): void {
    this.expression.setRequiresExpression();
    this.indexingExpr.setRequiresExpression();
  }

  patchAsExpression(): void {
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
  patchAsRepeatableExpression(repeatableOptions: RepeatableOptions = {}, patchOptions: PatchOptions = {}): string {
    if (repeatableOptions.isForAssignment) {
      this.expression.setRequiresRepeatableExpression({ isForAssignment: true, parens: true, ref: 'base' });
      this.indexingExpr.setRequiresRepeatableExpression({ ref: 'name' });
      this.patchAsExpression();
      this.commitDeferredSuffix();
      return `${this.expression.getRepeatCode()}[${this.indexingExpr.getRepeatCode()}]`;
    } else {
      return super.patchAsRepeatableExpression(repeatableOptions, patchOptions);
    }
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
