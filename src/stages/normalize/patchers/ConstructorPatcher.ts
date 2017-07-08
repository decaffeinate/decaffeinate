import NodePatcher from '../../../patchers/NodePatcher';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import { PatcherContext } from '../../../patchers/types';

export default class ConstructorPatcher extends PassthroughPatcher {
  assignee: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext, assignee, expression);
    this.assignee = assignee;
    this.expression = expression;
  }
}
