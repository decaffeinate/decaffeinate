import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import { isSemanticToken } from '../../../utils/types';
import IdentifierPatcher from './IdentifierPatcher';
import ModuleSpecifierPatcher from './ModuleSpecifierPatcher';
import StringPatcher from './StringPatcher';

export default class ImportDeclarationPatcher extends NodePatcher {
  constructor(
    patcherContext: PatcherContext,
    public defaultBinding: IdentifierPatcher | null,
    public namespaceImport: IdentifierPatcher | null,
    public namedImports: Array<ModuleSpecifierPatcher> | null,
    public source: StringPatcher,
  ) {
    super(patcherContext);
  }

  patchAsStatement(): void {
    if (this.defaultBinding) {
      this.defaultBinding.patch();
    }

    if (this.namespaceImport) {
      this.namespaceImport.patch();
    }

    const { namedImports } = this;

    if (namedImports) {
      namedImports.forEach((namedImport, i) => {
        namedImport.patch();
        const isLast = i === namedImports.length - 1;
        const commaTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
          namedImport.outerEndTokenIndex,
          SourceType.COMMA,
          isSemanticToken,
        );
        const commaToken = commaTokenIndex && this.sourceTokenAtIndex(commaTokenIndex);
        if (!isLast && !commaToken) {
          this.insert(namedImport.outerEnd, ',');
        }
      });
    }

    this.source.patch();
  }
}
