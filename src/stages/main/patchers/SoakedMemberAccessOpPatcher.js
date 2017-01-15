import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import findSoakContainer from '../../../utils/findSoakContainer';

const GUARD_HELPER =
  `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedMemberAccessOpPatcher extends MemberAccessOpPatcher {
  _shouldSkipSoakPatch: boolean;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext, expression);
    this._shouldSkipSoakPatch = false;
  }

  patchAsExpression() {
    if (!this._shouldSkipSoakPatch) {
      this.registerHelper('__guard__', GUARD_HELPER);

      let soakContainer = findSoakContainer(this);
      let varName = soakContainer.claimFreeBinding('x');
      let prefix = this.slice(soakContainer.contentStart, this.contentStart);

      if (prefix.length > 0) {
        this.remove(soakContainer.contentStart, this.contentStart);
      }

      let memberNameToken = this.getMemberNameSourceToken();
      this.overwrite(this.expression.outerEnd, memberNameToken.start, `, ${varName} => ${prefix}${varName}.`);

      if (soakContainer.prepend)
        soakContainer.prepend(soakContainer.contentStart, '__guard__(');
      else
        soakContainer.insert(soakContainer.contentStart, '__guard__(');
      soakContainer.insert(soakContainer.contentEnd, ')');
    }
    this.expression.patch();
  }

    /**
     * Insert content at the specified index.
     */
    prepend(index: number, content: string) {
        if (typeof index !== 'number') {
            throw new Error(
                `cannot insert ${JSON.stringify(content)} at non-numeric index ${index}`
            );
        }
        this.log(
            'PREPEND LEFT',
            index,
            JSON.stringify(content),
            'BEFORE',
            JSON.stringify(this.context.source.slice(index, index + 8))
        );

        this.adjustBoundsToInclude(index);
        this.editor.prependRight(index, content);
    }

    setShouldSkipSoakPatch() {
    this._shouldSkipSoakPatch = true;
  }

  /**
   * There isn't an implicit-dot syntax like @a for soaked access.
   */
  hasImplicitOperator(): boolean {
    return false;
  }
}
