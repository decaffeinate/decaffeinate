import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class ObjectInitialiserMemberPatcher extends PassthroughPatcher {
  key: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, key: NodePatcher, expression: NodePatcher) {
    super(patcherContext, key, expression);
    this.key = key;
    this.expression = expression;
  }
}
