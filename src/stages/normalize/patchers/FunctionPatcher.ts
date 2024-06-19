import { SourceType } from 'coffee-lex';
import { Constructor, Node } from 'decaffeinate-parser';
import { PatcherContext } from '../../../patchers/types';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';
import containsSuperCall from '../../../utils/containsSuperCall';
import getAssigneeBindings from '../../../utils/getAssigneeBindings';
import normalizeListItem from '../../../utils/normalizeListItem';
import notNull from '../../../utils/notNull';
import stripSharedIndent from '../../../utils/stripSharedIndent';
import NodePatcher from './../../../patchers/NodePatcher';
import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import BlockPatcher from './BlockPatcher';
import DefaultParamPatcher from './DefaultParamPatcher';
import ExpansionPatcher from './ExpansionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import RestPatcher from './SpreadPatcher';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: BlockPatcher | null;
  _thisAfterSuper = false;

  constructor(patcherContext: PatcherContext, parameters: Array<NodePatcher>, body: BlockPatcher | null) {
    super(patcherContext);
    this.parameters = parameters;
    this.body = body;
  }

  patchAsExpression(): void {
    // Make sure there is at least one character of whitespace between the ->
    // and the body, since otherwise the main stage can run into subtle
    // magic-string issues later.
    if (this.body && !this.slice(this.body.contentStart - 1, this.body.contentStart).match(/\s/)) {
      this.insert(this.body.contentStart, ' ');
    }

    const neededExplicitBindings = [];

    const firstRestParamIndex = this.getFirstRestParamIndex();
    const assignments = [];
    const thisAssignmentsAfterSuper = [];
    for (const [i, parameter] of this.parameters.entries()) {
      if (firstRestParamIndex === -1 || i < firstRestParamIndex) {
        const { newAssignments, newThisAssignments, newBindings } = this.patchParameterAndGetAssignments(parameter);
        assignments.push(...newAssignments);
        thisAssignmentsAfterSuper.push(...newThisAssignments);
        neededExplicitBindings.push(...newBindings);
      } else {
        parameter.patch();
      }
      normalizeListItem(this, parameter, this.parameters[i + 1]);
      if (i === this.parameters.length - 1) {
        // Parameter lists allow trailing semicolons but not trailing commas, so
        // just get rid of it as a special case if it's there.
        const nextToken = parameter.nextSemanticToken();
        if (nextToken && nextToken.type === SourceType.SEMICOLON) {
          this.remove(nextToken.start, nextToken.end);
        }
      }
    }

    if (firstRestParamIndex !== -1) {
      if (
        firstRestParamIndex === this.parameters.length - 1 &&
        this.parameters[this.parameters.length - 1] instanceof ExpansionPatcher
      ) {
        // Just get rid of the ... at the end if it's there.
        if (firstRestParamIndex === 0) {
          this.remove(this.parameters[0].contentStart, this.parameters[0].contentEnd);
        } else {
          this.remove(
            this.parameters[firstRestParamIndex - 1].outerEnd,
            this.parameters[this.parameters.length - 1].outerEnd,
          );
        }
      } else {
        // Move expansion or intermediate rest params into an array destructure
        // on the first line.
        const candidateName = firstRestParamIndex === 0 ? 'args' : 'rest';
        const paramName = this.claimFreeBinding(candidateName);
        const restParamsStart = this.parameters[firstRestParamIndex].contentStart;
        const restParamsEnd = this.parameters[this.parameters.length - 1].contentEnd;
        let paramCode = this.slice(restParamsStart, restParamsEnd);
        paramCode = this.fixGeneratedAssigneeWhitespace(paramCode);
        this.overwrite(restParamsStart, restParamsEnd, `${paramName}...`);

        assignments.push(`[${paramCode}] = ${paramName}`);
        for (let i = firstRestParamIndex; i < this.parameters.length; i++) {
          neededExplicitBindings.push(...getAssigneeBindings(this.parameters[i].node));
        }
      }
    }

    let uniqueExplicitBindings = [...new Set(neededExplicitBindings)];
    // To avoid ugly code, limit the explicit `var` to cases where we're
    // actually shadowing an outer variable.
    uniqueExplicitBindings = uniqueExplicitBindings.filter((name) => notNull(this.parent).getScope().hasBinding(name));
    if (uniqueExplicitBindings.length > 0) {
      assignments.unshift(`\`var ${uniqueExplicitBindings.join(', ')};\``);
    }

    // If there were assignments from parameters insert them
    if (this.body) {
      if (thisAssignmentsAfterSuper.length > 0) {
        this.body.insertStatementsAtIndex(thisAssignmentsAfterSuper, this.getIndexOfSuperStatement() + 1);
      }
      // before the actual body
      for (const assignment of assignments) {
        this.body.insertLineBefore(assignment);
      }
      this.body.patch();
    } else if (assignments.length) {
      // as the body if there is no body
      // Add a return statement for non-constructor methods without body to avoid bad implicit return
      if (!(this.context.getParent(this.node) instanceof Constructor)) {
        assignments.push('return');
      }
      const indent = this.getIndent(1);
      const text = assignments.join(`\n${indent}`);
      this.insert(this.contentEnd, `\n${indent}${text}`);
    }
  }

  /**
   * Produce assignments to put at the top of the function for this parameter.
   * Also declare any variables that are assigned and need to be
   * function-scoped, so the outer code can insert `var` declarations.
   */
  patchParameterAndGetAssignments(parameter: NodePatcher): {
    newAssignments: Array<string>;
    newThisAssignments: Array<string>;
    newBindings: Array<string>;
  } {
    const thisAssignments: Array<string> = [];
    const defaultParamAssignments: Array<string> = [];

    const newBindings: Array<string> = [];

    // To avoid knowledge of all the details how assignments can be nested in nodes,
    // we add a callback to the function node before patching the parameters and remove it afterwards.
    // This is detected and used by the MemberAccessOpPatcher to claim a free binding for this parameter
    // (from the functions scope, not the body's scope)
    this.addThisAssignmentAtScopeHeader = (memberName: string): string => {
      const varName = this.claimFreeBinding(memberName);
      thisAssignments.push(`@${memberName} = ${varName}`);
      this.log(`Replacing parameter @${memberName} with ${varName}`);
      return varName;
    };
    this.addDefaultParamAssignmentAtScopeHeader = (
      assigneeCode: string,
      initCode: string,
      assigneeNode: Node,
    ): string => {
      if (assigneeNode.type === 'Identifier' || assigneeNode.type === 'MemberAccessOp') {
        // Wrap in parens to avoid precedence issues for inline statements. The
        // parens will be removed later in normal situations.
        defaultParamAssignments.push(`(${assigneeCode} ?= ${initCode})`);
        return assigneeCode;
      } else {
        // Handle cases like `({a}={}) ->`, where we need to check for default
        // with the param as a normal variable, then include the destructure.
        assigneeCode = this.fixGeneratedAssigneeWhitespace(assigneeCode);
        const paramName = this.claimFreeBinding('param');
        defaultParamAssignments.push(`(${paramName} ?= ${initCode})`);
        defaultParamAssignments.push(`${assigneeCode} = ${paramName}`);
        newBindings.push(...getAssigneeBindings(assigneeNode));
        return paramName;
      }
    };

    parameter.patch();

    delete this.addDefaultParamAssignmentAtScopeHeader;
    delete this.addThisAssignmentAtScopeHeader;

    if (this.options.useCS2 && this.thisAfterSuperEnabled() && this.getIndexOfSuperStatement() >= 0) {
      return {
        newAssignments: defaultParamAssignments,
        newThisAssignments: thisAssignments,
        newBindings,
      };
    } else {
      return {
        newAssignments: [...defaultParamAssignments, ...thisAssignments],
        newThisAssignments: [],
        newBindings,
      };
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
  fixGeneratedAssigneeWhitespace(assigneeCode: string): string {
    const firstNewlineIndex = assigneeCode.indexOf('\n');
    if (firstNewlineIndex < 0) {
      return assigneeCode;
    }
    const indent = this.body ? this.body.getIndent(0) : this.getIndent(1);
    const firstLine = assigneeCode.substr(0, firstNewlineIndex);
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
    // If there is any expansion param, all params need to be pulled into the
    // array destructure, so set index 0. For example, in the param list
    // `(a, ..., b, c)`, `b` is set to the second-to-last arg, which might be the
    // same as `a`, so all args need to be included in the destructure.
    if (this.parameters.some((param, i) => i < this.parameters.length - 1 && param instanceof ExpansionPatcher)) {
      return 0;
    }

    for (let i = 0; i < this.parameters.length; i++) {
      const parameter = this.parameters[i];

      // We have separate code to handle relatively simple default params that
      // results in better code, so use that.
      if (
        parameter instanceof DefaultParamPatcher &&
        canPatchAssigneeToJavaScript(parameter.param.node, this.options)
      ) {
        continue;
      }

      // A rest assignment at the very end can be converted correctly as long as
      // it does not expand the rest array in a complicated way.
      if (
        i === this.parameters.length - 1 &&
        parameter instanceof RestPatcher &&
        parameter.expression instanceof IdentifierPatcher
      ) {
        continue;
      }

      if (
        (!this.options.useCS2 && parameter instanceof ArrayInitialiserPatcher) ||
        !canPatchAssigneeToJavaScript(parameter.node, this.options)
      ) {
        return i;
      }
    }
    return -1;
  }

  getIndexOfSuperStatement(): number {
    if (!this.body) {
      return -1;
    }
    const statements = this.body.statements;
    for (let i = 0; i < statements.length; i++) {
      if (containsSuperCall(statements[i].node)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Call before initialization to tell the patcher to place
   * assignments to `this` after `super()`.
   */
  enableThisAfterSuper(): void {
    this._thisAfterSuper = true;
  }

  /**
   * Determines whether the patcher needs to place
   * assignments to `this` after `super()`.
   */
  thisAfterSuperEnabled(): boolean {
    return this._thisAfterSuper;
  }
}
