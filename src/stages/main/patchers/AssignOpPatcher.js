import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import ExpansionPatcher from './ExpansionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher';
import SlicePatcher from './SlicePatcher';
import StringPatcher from './StringPatcher';
import ThisPatcher from './ThisPatcher';
import SpreadPatcher from './SpreadPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';

import type { PatcherContext } from './../../../patchers/types';

const MULTI_ASSIGN_SINGLE_LINE_MAX_LENGTH = 100;

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext);
    this.assignee = assignee;
    this.expression = expression;
  }

  initialize() {
    this.assignee.setRequiresExpression();
    this.expression.setRequiresExpression();
  }

  /**
   * Assignment operators have lower precedence than negation, so we need to add
   * parens.
   */
  negate() {
    this.insert(this.innerStart, '!(');
    this.insert(this.innerEnd, ')');
  }

  patchAsExpression({ needsParens=false }={}) {
    let shouldAddParens = needsParens && !this.isSurroundedByParentheses();
    if (shouldAddParens) {
      this.insert(this.outerStart, '(');
    }

    if (canPatchAssigneeToJavaScript(this.assignee.node)) {
      this.patchSimpleAssignment();
    } else {
      let assignments = [];

      // In an expression context, the result should always be the value of the
      // RHS, so we need to make it repeatable if it's not.
      let expressionCode;
      if (this.expression.isRepeatable()) {
        expressionCode = this.expression.patchAndGetCode();
      } else {
        let fullExpression = this.expression.patchAndGetCode();
        expressionCode = this.claimFreeBinding();
        assignments.push(`${expressionCode} = ${fullExpression}`);
      }
      assignments.push(
        ...this.generateAssignments(this.assignee, expressionCode, true)
      );
      if (this.willPatchAsExpression()) {
        assignments.push(`${expressionCode}`);
      }

      let assignmentCode = assignments.join(', ');
      if (assignmentCode.startsWith('{')) {
        assignmentCode = `(${assignmentCode})`;
      }
      this.overwrite(this.contentStart, this.contentEnd, assignmentCode);
    }

    if (shouldAddParens) {
      this.insert(this.outerEnd, ')');
    }
  }

  patchAsStatement() {
    if (canPatchAssigneeToJavaScript(this.assignee.node)) {
      let shouldAddParens = this.assignee.statementShouldAddParens();
      if (shouldAddParens) {
        this.insert(this.contentStart, '(');
      }
      this.patchSimpleAssignment();
      if (shouldAddParens) {
        this.insert(this.contentEnd, ')');
      }
    } else {
      let assignments = this.generateAssignments(
        this.assignee, this.expression.patchAndGetCode(), this.expression.isRepeatable());
      this.overwriteWithAssignments(assignments);
    }
  }

  patchSimpleAssignment() {
    let needsArrayFrom = this.assignee instanceof ArrayInitialiserPatcher;
    this.assignee.patch();
    if (needsArrayFrom) {
      this.insert(this.expression.outerStart, 'Array.from(');
    }
    this.expression.patch();
    if (needsArrayFrom) {
      this.insert(this.expression.outerEnd, ')');
    }
  }

  overwriteWithAssignments(assignments: Array<string>) {
    let assignmentCode = assignments.join(', ');
    if (assignmentCode.length > MULTI_ASSIGN_SINGLE_LINE_MAX_LENGTH) {
      assignmentCode = assignments.join(`,\n${this.getIndent(1)}`);
    }
    if (assignmentCode.startsWith('{')) {
      assignmentCode = `(${assignmentCode})`;
    }
    this.overwrite(this.contentStart, this.contentEnd, assignmentCode);
  }

  /**
   * Recursively walk a CoffeeScript assignee to generate a sequence of
   * JavaScript assignments.
   *
   * patcher is a patcher for the assignee.
   * ref is a code snippet, not necessarily repeatable, that can be used to
   *   reference the value being assigned.
   * refIsRepeatable says whether ref may be used more than once. If not, we
   *   sometimes generate an extra assignment to make it repeatable.
   */
  generateAssignments(patcher: NodePatcher, ref: string, refIsRepeatable: boolean): Array<string> {
    if (canPatchAssigneeToJavaScript(patcher.node)) {
      let assigneeCode = patcher.patchAndGetCode();
      if (patcher instanceof ArrayInitialiserPatcher) {
        return [`${assigneeCode} = Array.from(${ref})`];
      } else {
        return [`${assigneeCode} = ${ref}`];
      }
    } else if (patcher instanceof ExpansionPatcher) {
      // Expansions don't produce assignments.
      return [];
    } else if (patcher instanceof SpreadPatcher) {
      // Calling code seeing a spread patcher should provide an expression for
      // the resolved array.
      return this.generateAssignments(patcher.expression, ref, refIsRepeatable);
    } else if (patcher instanceof ArrayInitialiserPatcher) {
      if (!refIsRepeatable) {
        let arrReference = this.claimFreeBinding('array');
        return [
          `${arrReference} = ${ref}`,
          ...this.generateAssignments(patcher, arrReference, true)
        ];
      }

      let assignees = patcher.members;
      let hasSeenExpansion;
      let assignments = [];
      for (let [i, assignee] of assignees.entries()) {
        let valueCode;
        if (assignee instanceof ExpansionPatcher || assignee instanceof SpreadPatcher) {
          hasSeenExpansion = true;
          valueCode = `${ref}.slice(${i}, ${ref}.length - ${assignees.length - i - 1})`;
        } else if (hasSeenExpansion) {
          valueCode = `${ref}[${ref}.length - ${assignees.length - i}]`;
        } else {
          valueCode = `${ref}[${i}]`;
        }
        assignments.push(...this.generateAssignments(assignee, valueCode, false));
      }
      return assignments;
    } else if (patcher instanceof ObjectInitialiserPatcher) {
      if (!refIsRepeatable) {
        let objReference = this.claimFreeBinding('obj');
        return [
          `${objReference} = ${ref}`,
          ...this.generateAssignments(patcher, objReference, true)
        ];
      }

      let assignments = [];
      for (let member of patcher.members) {
        if (member instanceof ObjectInitialiserMemberPatcher) {
          let valueCode = `${ref}${this.accessFieldForObjectDestructure(member.key)}`;
          assignments.push(...this.generateAssignments(member.expression, valueCode, false));
        } else if (member instanceof AssignOpPatcher) {
          // Assignments like {a = b} = c end up as an assign op.
          let valueCode = `${ref}${this.accessFieldForObjectDestructure(member.assignee)}`;
          assignments.push(...this.generateAssignments(member, valueCode, false));
        } else {
          throw this.error(`Unexpected object initializer member: ${patcher.node.type}`);
        }
      }
      return assignments;
    } else if (patcher instanceof SlicePatcher) {
      return [`${patcher.getInitialSpliceCode()}, ...[].concat(${ref}))`];
    } else if (patcher instanceof AssignOpPatcher) {
      if (!refIsRepeatable) {
        let valReference = this.claimFreeBinding('val');
        return [
          `${valReference} = ${ref}`,
          ...this.generateAssignments(patcher, valReference, true)
        ];
      }
      let defaultCode = patcher.expression.patchAndGetCode();
      return this.generateAssignments(
        patcher.assignee, `${ref} != null ? ${ref} : ${defaultCode}`, false);
    } else {
      throw this.error(`Invalid assignee type: ${patcher.node.type}`);
    }
  }

  accessFieldForObjectDestructure(patcher: NodePatcher): string {
    if (patcher instanceof IdentifierPatcher) {
      return `.${patcher.node.data}`;
    } else if (patcher instanceof MemberAccessOpPatcher && patcher.expression instanceof ThisPatcher) {
      return `.${patcher.node.member.data}`;
    } else if (patcher instanceof StringPatcher) {
      return `[${patcher.patchAndGetCode()}]`;
    } else {
      throw this.error(`Unexpected object destructure expression: ${patcher.node.type}`);
    }
  }
}
