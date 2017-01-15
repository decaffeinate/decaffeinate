import ExpansionPatcher from './ExpansionPatcher';
import RestPatcher from './SpreadPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import stripSharedIndent from '../../../utils/stripSharedIndent';

import type { PatcherContext } from './../../../patchers/types';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: ?NodePatcher;

  constructor(patcherContext: PatcherContext, parameters: Array<NodePatcher>, body: ?NodePatcher) {
    super(patcherContext);
    this.parameters = parameters;
    this.body = body;
  }

  patchAsExpression() {
    // Make sure there is at least one character of whitespace between the ->
    // and the body, since otherwise the main stage can run into subtle
    // magic-string issues later.
    if (this.body && !this.slice(this.body.contentStart - 1, this.body.contentStart).match(/\s/)) {
      this.insert(this.body.contentStart, ' ');
    }

    let expansionIndex = this.getExpansionIndex();
    let assignments = [];
    for (let [i, parameter] of this.parameters.entries()) {
      if (expansionIndex === -1 || i < expansionIndex) {
        assignments.push(...this.patchParameterAndGetAssignments(parameter));
      } else {
        parameter.patch();
      }
    }

    if (expansionIndex !== -1) {
      if (expansionIndex === this.parameters.length - 1) {
        // Just get rid of the ... at the end (this case isn't exercised for
        // rest params at the end since those just become regular JS).
        if (expansionIndex === 0) {
          this.remove(this.parameters[0].contentStart, this.parameters[0].contentEnd);
        } else {
          this.remove(
            this.parameters[expansionIndex - 1].outerEnd,
            this.parameters[this.parameters.length - 1].outerEnd
          );
        }
      } else {
        // Move expansion or intermediate rest params into an array destructure
        // on the first line.
        let candidateName = expansionIndex === 0 ? 'args' : 'rest';
        let paramName = this.claimFreeBinding(candidateName);
        let restParamsStart = this.parameters[expansionIndex].outerStart;
        let restParamsEnd = this.parameters[this.parameters.length - 1].outerEnd;
        let paramCode = this.slice(restParamsStart, restParamsEnd);
        this.overwrite(restParamsStart, restParamsEnd, `${paramName}...`);
        assignments.push(`[${paramCode}] = ${paramName}`);
      }
    }

    // If there were assignments from parameters insert them
    if (this.body) {
      // before the actual body
      for (let assignment of assignments) {
        this.body.insertLineBefore(assignment);
      }
      this.body.patch();
    } else if (assignments.length) {
      // as the body if there is no body
      // Add a return statement for non-constructor methods without body to avoid bad implicit return
      if (this.node.parentNode.type !== 'Constructor') {
        assignments.push('return');
      }
      let indent = this.getIndent(1);
      let text = assignments.join(`\n${indent}`);
      this.insert(this.contentEnd, `\n${indent}${text}`);
    }
  }

  patchParameterAndGetAssignments(parameter: NodePatcher) {
    let thisAssignments = [];
    let defaultParamAssignments = [];

    // To avoid knowledge of all the details how assignments can be nested in nodes,
    // we add a callback to the function node before patching the parameters and remove it afterwards.
    // This is detected and used by the MemberAccessOpPatcher to claim a free binding for this parameter
    // (from the functions scope, not the body's scope)
    this.addThisAssignmentAtScopeHeader = (memberName: string) => {
      let varName = this.claimFreeBinding(memberName);
      thisAssignments.push(`@${memberName} = ${varName}`);
      this.log(`Replacing parameter @${memberName} with ${varName}`);
      return varName;
    };
    this.addDefaultParamAssignmentAtScopeHeader = (assigneeCode: string, initCode: string, assigneeIsValidExpression: boolean) => {
      if (assigneeIsValidExpression) {
        defaultParamAssignments.push(`${assigneeCode} ?= ${initCode}`);
        return assigneeCode;
      } else {
        // Handle cases like `({a}={}) ->`, where we need to check for default
        // with the param as a normal variable, then include the destructure.
        assigneeCode = this.fixGeneratedAssigneeWhitespace(assigneeCode);
        let paramName = this.claimFreeBinding('param');
        defaultParamAssignments.push(`${paramName} ?= ${initCode}`);
        defaultParamAssignments.push(`${assigneeCode} = ${paramName}`);
        return paramName;
      }
    };

    parameter.patch();

    delete this.addDefaultParamAssignmentAtScopeHeader;
    delete this.addThisAssignmentAtScopeHeader;

    return [...defaultParamAssignments, ...thisAssignments];
  }

  /**
   * If the assignee in a generated code is multiline and we're not careful, we
   * might end up placing code before the function body indentation level, which
   * will make the CoffeeScript parser complain later. To fix, adjust the
   * indentation to the desired level. Note that this potentially could add
   * whitespace to multiline strings, but all types of multiline strings in
   * CoffeeScript strip common leading whitespace, so the resulting code is
   * still the same.
   */
  fixGeneratedAssigneeWhitespace(assigneeCode: string) {
    let firstNewlineIndex = assigneeCode.indexOf('\n');
    if (firstNewlineIndex < 0) {
      return assigneeCode;
    }
    let indent = this.body ? this.body.getIndent(0) : this.getIndent(1);
    let firstLine = assigneeCode.substr(0, firstNewlineIndex);
    let otherLines = assigneeCode.substr(firstNewlineIndex + 1);
    otherLines = stripSharedIndent(otherLines);
    otherLines = otherLines.replace(/\n/g, `\n${indent}`);
    return `${firstLine}\n${indent}${otherLines}`;
  }

  /**
   * Get the index of the expansion node or rest param, if any.
   */
  getExpansionIndex(): number {
    for (let i = 0 ; i < this.parameters.length; i++) {
      if (this.parameters[i] instanceof ExpansionPatcher ||
          (i < this.parameters.length - 1 && this.parameters[i] instanceof RestPatcher)) {
        return i;
      }
    }
    return -1;
  }
}
