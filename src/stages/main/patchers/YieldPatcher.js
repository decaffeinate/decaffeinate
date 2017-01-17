import AssignOpPatcher from './AssignOpPatcher';
import BlockPatcher from './BlockPatcher';
import ReturnPatcher from './ReturnPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class YieldPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }
  
  initialize() {
    this.yields();
    this.expression.setRequiresExpression();
  }

  /**
   * 'yield' EXPRESSION
   */
  patchAsExpression({ needsParens=true }={}) {
    let surroundInParens = this.needsParens() && !this.isSurroundedByParentheses();
    if (surroundInParens) {
      this.insert(this.contentStart, '(');
    }
    this.expression.patch({ needsParens });
    if (surroundInParens) {
      this.insert(this.contentEnd, ')');
    }
  }

  needsParens() {
    return !(
      this.parent instanceof BlockPatcher ||
      this.parent instanceof ReturnPatcher ||
      (this.parent instanceof AssignOpPatcher && this.parent.expression === this));
  }
}
