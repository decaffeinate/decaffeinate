import NodePatcher from './../../../patchers/NodePatcher';
import ConditionalPatcher from './ConditionalPatcher';
import SwitchPatcher from './SwitchPatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class ReturnPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.setExplicitlyReturns();
    if (this.expression !== null) {
      if (this.willConvertToImplicitReturn()) {
        this.expression.setImplicitlyReturns();
      } else {
        this.expression.setRequiresExpression();
      }
    }
  }

  /**
   * Return statements cannot be expressions.
   */
  canPatchAsExpression(): boolean {
    return false;
  }

  patchAsStatement() {
    if (this.expression) {
      if (this.willConvertToImplicitReturn()) {
        this.remove(this.contentStart, this.expression.outerStart);
      }
      this.expression.patch();
    }
  }

  willConvertToImplicitReturn() {
    return !this.expression.isSurroundedByParentheses() && (
      this.expression instanceof ConditionalPatcher ||
      this.expression instanceof SwitchPatcher
    );
  }
}
