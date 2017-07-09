import SharedBlockPatcher from '../../../patchers/SharedBlockPatcher';
import ForPatcher from './ForPatcher';

export default class BlockPatcher extends SharedBlockPatcher {
  setShouldPatchInline(shouldPatchInline: boolean): void;
  markForPatcherDescendant(forPatcher: ForPatcher): void;
}
