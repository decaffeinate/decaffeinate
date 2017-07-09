import { PatcherContext } from '../../../patchers/types';
import { AVOID_TOP_LEVEL_RETURN } from '../../../suggestions';
import NodePatcher from './../../../patchers/NodePatcher';
import ConditionalPatcher from './ConditionalPatcher';
import SwitchPatcher from './SwitchPatcher';

export default class ReturnPatcher extends NodePatcher {
  expression: NodePatcher | null;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher | null) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize(): void {
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

  patchAsStatement(): void {
    if (this.getScope().containerNode.type === 'Program') {
      this.addSuggestion(AVOID_TOP_LEVEL_RETURN);
    }
    if (this.expression) {
      if (this.willConvertToImplicitReturn()) {
        this.remove(this.contentStart, this.expression.outerStart);
      }
      this.expression.patch();
    }
  }

  willConvertToImplicitReturn(): boolean {
    if (!this.expression) {
      throw this.error('Expected non-null expression.');
    }
    return !this.expression.isSurroundedByParentheses() && (
      this.expression instanceof ConditionalPatcher ||
      this.expression instanceof SwitchPatcher
    );
  }
}
