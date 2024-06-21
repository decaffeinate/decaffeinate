import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import IdentifierPatcher from './IdentifierPatcher';

export default class ModuleSpecifierPatcher extends NodePatcher {
  constructor(
    patcherContext: PatcherContext,
    public original: IdentifierPatcher,
    public alias: IdentifierPatcher | null,
  ) {
    super(patcherContext);
  }

  patchAsStatement(): void {
    this.original.patch();

    if (this.alias) {
      this.alias.patch();
    }
  }
}
