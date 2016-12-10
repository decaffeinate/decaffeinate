import NodePatcher from './../../../patchers/NodePatcher.js';
import stripSharedIndent from '../../../utils/stripSharedIndent.js';

import type { PatcherContext } from './../../../patchers/types.js';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: ?NodePatcher;
  
  constructor(patcherContext: PatcherContext, parameters: Array<NodePatcher>, body: ?NodePatcher) {
    super(patcherContext);
    this.parameters = parameters;
    this.body = body;
  }

  patchAsExpression() {
    // To avoid knowledge of all the details how assignments can be nested in nodes,
    // we add a callback to the function node before patching the parameters and remove it afterwards.
    // This is detected and used by the MemberAccessOpPatcher to claim a free binding for this parameter
    // (from the functions scope, not the body's scope)

    let defaultParamAssignments = [];
    let thisAssignments = [];
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

    this.parameters.forEach(parameter => parameter.patch());

    delete this.addDefaultParamAssignmentAtScopeHeader;
    delete this.addThisAssignmentAtScopeHeader;

    let assignments = [...defaultParamAssignments, ...thisAssignments];

    // If there were assignments from parameters insert them
    if (this.body) {
      // before the actual body
      if (assignments.length) {
        let text;
        if (this.body.node.inline) {
          text = `${assignments.join('; ')}; `;
        } else {
          let indent = this.body.getIndent(0);
          text = `${assignments.join(`\n${indent}`)}\n${indent}`;
        }
        this.insert(this.body.contentStart, `${text}`);
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
}
