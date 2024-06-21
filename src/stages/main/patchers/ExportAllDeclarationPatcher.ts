import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import StringPatcher from './StringPatcher';

export default class ExportAllDeclarationPatcher extends NodePatcher {
  constructor(
    patcherContext: PatcherContext,
    public source: StringPatcher,
  ) {
    super(patcherContext);
  }

  patchAsStatement(): void {
    this.source.patch();
  }
}
