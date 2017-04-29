import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class ReturnPatcher extends NodePatcher {
  expression: NodePatcher;
  _willConvertToImplicitReturn: boolean = false;
  
  constructor(patcherContext: PatcherContext, expression: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.setExplicitlyReturns();
    if (this.expression !== null) {
      if (this.expression.canPatchAsExpression()) {
        this.expression.setRequiresExpression();
      } else {
        this.expression.setImplicitlyReturns();
        this._willConvertToImplicitReturn = true;
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
      if (this._willConvertToImplicitReturn) {
        this.remove(this.contentStart, this.expression.outerStart);
      }
      this.expression.patch();
    }
  }
}
