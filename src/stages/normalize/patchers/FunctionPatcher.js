import { SourceType } from 'coffee-lex';
import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import DefaultParamPatcher from './DefaultParamPatcher';
import ExpansionPatcher from './ExpansionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import RestPatcher from './SpreadPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';
import normalizeListItem from '../../../utils/normalizeListItem';
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

    let firstRestParamIndex = this.getFirstRestParamIndex();
    let assignments = [];
    for (let [i, parameter] of this.parameters.entries()) {
      if (firstRestParamIndex === -1 || i < firstRestParamIndex) {
        assignments.push(...this.patchParameterAndGetAssignments(parameter));
      } else {
        parameter.patch();
      }
      normalizeListItem(this, parameter, this.parameters[i + 1]);
      if (i === this.parameters.length - 1) {
        // Parameter lists allow trailing semicolons but not trailing commas, so
        // just get rid of it as a special case if it's there.
        let nextToken = parameter.nextToken();
        if (nextToken && nextToken.type === SourceType.SEMICOLON) {
          this.remove(nextToken.start, nextToken.end);
        }
      }
    }

    if (firstRestParamIndex !== -1) {
      if (firstRestParamIndex === this.parameters.length - 1 &&
          this.parameters[this.parameters.length - 1] instanceof ExpansionPatcher) {
        // Just get rid of the ... at the end if it's there.
        if (firstRestParamIndex === 0) {
          this.remove(this.parameters[0].contentStart, this.parameters[0].contentEnd);
        } else {
          this.remove(
            this.parameters[firstRestParamIndex - 1].outerEnd,
            this.parameters[this.parameters.length - 1].outerEnd
          );
        }
      } else {
        // Move expansion or intermediate rest params into an array destructure
        // on the first line.
        let candidateName = firstRestParamIndex === 0 ? 'args' : 'rest';
        let paramName = this.claimFreeBinding(candidateName);
        let restParamsStart = this.parameters[firstRestParamIndex].contentStart;
        let restParamsEnd = this.parameters[this.parameters.length - 1].contentEnd;
        let paramCode = this.slice(restParamsStart, restParamsEnd);
        paramCode = this.fixGeneratedAssigneeWhitespace(paramCode);
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
        // Wrap in parens to avoid precedence issues for inline statements. The
        // parens will be removed later in normal situations.
        defaultParamAssignments.push(`(${assigneeCode} ?= ${initCode})`);
        return assigneeCode;
      } else {
        // Handle cases like `({a}={}) ->`, where we need to check for default
        // with the param as a normal variable, then include the destructure.
        assigneeCode = this.fixGeneratedAssigneeWhitespace(assigneeCode);
        let paramName = this.claimFreeBinding('param');
        defaultParamAssignments.push(`(${paramName} ?= ${initCode})`);
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
   * Get the index of the first parameter that will be included in the rest
   * parameters (if any). All parameters from this point forward will be moved
   * to an array destructure at the start of the function.
   *
   * The main stage handles the fully general case for array destructuring,
   * including things like nested expansions and defaults, so anything requiring
   * that level of generality should be extracted to an array destructure.
   * Simpler cases that only use param defaults and this-assignment are better
   * off being handled as normal parameters if we can get away with it. Also,
   * any array destructure in a parameter needs to be extracted so that we can
   * properly wrap it in Array.from.
   */
  getFirstRestParamIndex(): number {
    for (let i = 0; i < this.parameters.length; i++) {
      let parameter = this.parameters[i];

      // We have separate code to handle relatively simple default params that
      // results in better code, so use that.
      if (parameter instanceof DefaultParamPatcher &&
          canPatchAssigneeToJavaScript(parameter.param.node)) {
        continue;
      }

      // A rest assignment at the very end can be converted correctly as long as
      // it does not expand the rest array in a complicated way.
      if (i === this.parameters.length - 1 &&
        parameter instanceof RestPatcher &&
        parameter.expression instanceof IdentifierPatcher) {
        continue;
      }

      if (parameter instanceof ArrayInitialiserPatcher ||
          !canPatchAssigneeToJavaScript(parameter.node)) {
        return i;
      }
    }
    return -1;
  }
}
