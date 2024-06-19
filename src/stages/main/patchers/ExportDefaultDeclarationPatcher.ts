import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';

export default class ExportDefaultDeclarationPatcher extends NodePatcher {
  constructor(
    patcherContext: PatcherContext,
    public expression: NodePatcher,
  ) {
    super(patcherContext);
  }

  patchAsStatement(): void {
    this.expression.patch();
  }
}
