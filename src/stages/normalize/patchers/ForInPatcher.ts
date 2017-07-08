import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import BlockPatcher from './BlockPatcher';
import ForPatcher from './ForPatcher';

export default class ForInPatcher extends ForPatcher {
  step: NodePatcher | null;
  
  constructor(
      patcherContext: PatcherContext, keyAssignee: NodePatcher | null,
      valAssignee: NodePatcher | null, target: NodePatcher, step: NodePatcher | null,
      filter: NodePatcher | null, body: BlockPatcher) {
    super(patcherContext, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  patchAsExpression(): void {
    if (this.step) {
      this.step.patch();
    }
    super.patchAsExpression();
  }

  surroundThenUsagesInParens(): void {
    if (this.step && postfixExpressionRequiresParens(this.slice(this.step.contentStart, this.step.contentEnd))) {
      this.step.surroundInParens();
    }
    super.surroundThenUsagesInParens();
  }
}
