import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import { isSemanticToken } from '../../../utils/types';
import ModuleSpecifierPatcher from './ModuleSpecifierPatcher';
import StringPatcher from './StringPatcher';

export default class ExportBindingsDeclarationPatcher extends NodePatcher {
  constructor(
    patcherContext: PatcherContext,
    public namedExports: Array<ModuleSpecifierPatcher>,
    public source: StringPatcher | null,
  ) {
    super(patcherContext);
  }

  patchAsStatement(): void {
    this.namedExports.forEach((namedExport, i) => {
      namedExport.patch();

      const isLast = i === this.namedExports.length - 1;
      const commaTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        namedExport.outerEndTokenIndex,
        SourceType.COMMA,
        isSemanticToken,
      );
      const commaToken = commaTokenIndex && this.sourceTokenAtIndex(commaTokenIndex);
      if (!isLast && !commaToken) {
        this.insert(namedExport.outerEnd, ',');
      }
    });

    if (this.source) {
      this.source.patch();
    }
  }
}
