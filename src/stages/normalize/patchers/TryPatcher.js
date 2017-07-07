import NodePatcher from '../../../patchers/NodePatcher';
import type BlockPatcher from './BlockPatcher';
import type { PatcherContext } from '../../../patchers/types';
import IdentifierPatcher from './IdentifierPatcher';
import countVariableUsages from '../../../utils/countVariableUsages';

export default class TryPatcher extends NodePatcher {
  body: ?BlockPatcher;
  catchAssignee: ?NodePatcher;
  catchBody: ?BlockPatcher;
  finallyBody: ?BlockPatcher;

  constructor(patcherContext: PatcherContext, body: ?BlockPatcher, catchAssignee: ?NodePatcher, catchBody: ?BlockPatcher, finallyBody: ?BlockPatcher) {
    super(patcherContext);
    this.body = body;
    this.catchAssignee = catchAssignee;
    this.catchBody = catchBody;
    this.finallyBody = finallyBody;
  }

  patchAsExpression() {
    if (this.body) {
      this.body.patch();
    }
    let bodyPrefixLine = this.patchCatchAssignee();
    if (bodyPrefixLine !== null) {
      if (this.catchBody) {
        this.catchBody.insertLineBefore(bodyPrefixLine);
      } else {
        this.insert(this.catchAssignee.outerEnd, ` then ${bodyPrefixLine}`);
      }
    }
    if (this.catchBody) {
      this.catchBody.patch();
    }
    if (this.finallyBody) {
      this.finallyBody.patch();
    }
  }

  patchCatchAssignee() {
    if (!this.catchAssignee) {
      return null;
    }
    if (this.needsExpressionExtracted()) {
      let assigneeName = this.claimFreeBinding('error');
      let assigneeCode = this.catchAssignee.patchAndGetCode();
      this.overwrite(this.catchAssignee.contentStart, this.catchAssignee.contentEnd, assigneeName);
      return `${assigneeCode} = ${assigneeName}`;
    } else {
      this.catchAssignee.patch();
      return null;
    }
  }

  /**
   * Catch assignees in CoffeeScript can have (mostly) arbitrary assignees,
   * while JS is more limited. Generally JS only supports assignees that can
   * create variables.
   *
   * Also, JavaScript exception assignees are scoped to the catch block while
   * CoffeeScript exception assignees follow function scoping, so pull the
   * variable out into an assignment if the variable is used externally.
   */
  needsExpressionExtracted(): boolean {
    if (!this.catchAssignee) {
      return false;
    }
    if (!(this.catchAssignee instanceof IdentifierPatcher)) {
      return true;
    }
    let varName = this.catchAssignee.node.data;
    let exceptionVarUsages = this.catchBody
      ? countVariableUsages(this.catchBody.node, varName) + 1
      : 1;
    let totalVarUsages = countVariableUsages(this.getScope().containerNode, varName);
    return totalVarUsages > exceptionVarUsages;
  }
}
