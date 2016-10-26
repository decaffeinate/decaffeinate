import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import findSoakContainer from '../../../utils/findSoakContainer.js';

const GUARD_HELPER =
  `function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}`;

export default class SoakedMemberAccessOpPatcher extends MemberAccessOpPatcher {
  _shouldSkipSoakPatch: boolean;

  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor, expression);
    this._shouldSkipSoakPatch = false;
  }

  patchAsExpression() {
    if (!this._shouldSkipSoakPatch) {
      this.registerHelper('__guard__', GUARD_HELPER);
      let memberNameToken = this.getMemberNameSourceToken();
      let soakContainer = findSoakContainer(this);
      let varName = soakContainer.claimFreeBinding('x');
      this.overwrite(this.expression.outerEnd, memberNameToken.start, `, ${varName} => ${varName}.`);
      soakContainer.insert(soakContainer.contentStart, '__guard__(');
      soakContainer.insert(soakContainer.contentEnd, ')');
    }
    this.expression.patch();
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
