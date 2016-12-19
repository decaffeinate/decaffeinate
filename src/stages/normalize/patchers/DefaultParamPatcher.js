import DoOpPatcher from './DoOpPatcher';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';

export default class DefaultParamPatcher extends PassthroughPatcher {
  param: NodePatcher;
  value: NodePatcher;

  constructor(patcherContext: PatcherContext, param: NodePatcher, value: NodePatcher) {
    super(patcherContext, param, value);
    this.param = param;
    this.value = value;
  }

  patch() {
    // Note that when there is both a `this` assignment and a default param
    // assignment (e.g. `(@a=b()) -> c`), assignment callbacks are run
    // bottom-up, so by the time this code runs, any necessary parameter
    // renaming will have already happened. This means that `paramCode` will
    // naturally have the renamed parameter, so we don't need to do anything
    // special.
    super.patch();
    if (this.shouldExtractToConditionalAssign()) {
      let callback = this.findAddDefaultParamAssignmentCallback();
      if (callback) {
        let paramCode = this.slice(this.param.contentStart, this.param.contentEnd);
        let valueCode = this.slice(this.value.contentStart, this.value.contentEnd);
        let assigneeIsValidExpression = this.param instanceof IdentifierPatcher ||
          this.param instanceof MemberAccessOpPatcher;

        let newParamCode = callback(paramCode, valueCode, assigneeIsValidExpression);
        this.overwrite(this.param.contentStart, this.param.contentEnd, newParamCode);
        this.remove(this.param.outerEnd, this.value.outerEnd);
      }
    }
  }

  findAddDefaultParamAssignmentCallback() {
    let patcher = this;

    while (patcher) {
      if (patcher.addDefaultParamAssignmentAtScopeHeader) {
        return patcher.addDefaultParamAssignmentAtScopeHeader;
      }
      // Don't consider this node if we're on the right side of another default
      // param (e.g. `(foo = (bar=3) ->) ->`).
      if (patcher.parent instanceof DefaultParamPatcher &&
        patcher.parent.value === patcher) {
        break;
      }
      patcher = patcher.parent;
    }
    return null;
  }

  /**
   * For correctness reasons, we usually need to extract the assignment into a
   * statement that checks null and undefined rather than just undefined. But
   * skip that step if the user opted out of it in favor of cleaner code, and
   * also in a case like `do (a=1) -> a`, which is handled later as a special
   * case and doesn't use JS default params.
   */
  shouldExtractToConditionalAssign() {
    if (this.options.looseDefaultParams) {
      return false;
    }
    if (this.parent instanceof FunctionPatcher && this.parent.parent instanceof DoOpPatcher) {
      return false;
    }
    return true;
  }
}
