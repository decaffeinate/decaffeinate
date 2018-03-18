import {PatcherContext, PatchOptions} from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';

export default class AwaitPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize(): void {
    this.awaits();
    this.expression.setRequiresExpression();
  }

  patchAsExpression({needsParens = true}: PatchOptions = {}): void {
    this.expression.patch({ needsParens });
  }
}
