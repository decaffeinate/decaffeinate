import { PatcherContext, PatchOptions } from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';
import AssignOpPatcher from './AssignOpPatcher';
import BlockPatcher from './BlockPatcher';
import ReturnPatcher from './ReturnPatcher';

export default class YieldPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }
  
  initialize(): void {
    this.yields();
    this.expression.setRequiresExpression();
  }

  /**
   * 'yield' EXPRESSION
   */
  patchAsExpression({needsParens = true}: PatchOptions = {}): void {
    let surroundInParens = this.needsParens() && !this.isSurroundedByParentheses();
    if (surroundInParens) {
      this.insert(this.contentStart, '(');
    }
    this.expression.patch({ needsParens });
    if (surroundInParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  needsParens(): boolean {
    return !(
      this.parent instanceof BlockPatcher ||
      this.parent instanceof ReturnPatcher ||
      (this.parent instanceof AssignOpPatcher && this.parent.expression === this));
  }
}
