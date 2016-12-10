import ArrayInitialiserPatcher from './ArrayInitialiserPatcher.js';
import ExpansionPatcher from './ExpansionPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

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

  patchAsExpression() {
    if (this.isExpansionAssignment()) {
      this.patchExpansionAssignment();
    } else {
      this.assignee.patch();
      this.expression.patch();
    }
  }

  statementNeedsParens(): boolean {
    if (this.isExpansionAssignment()) {
      return this.expansionAssignmentNeedsParens();
    } else {
      // The assignment needs parentheses when the LHS needs parens.
      return this.assignee.statementShouldAddParens();
    }
  }

  expansionAssignmentNeedsParens(): boolean {
    if (!this.expression.isRepeatable()) {
      // The left side will be an "array" variable.
      return false;
    }
    let expansionIndex = this.getExpansionIndex();
    if (expansionIndex === this.assignee.members.length - 1) {
      // Simple case where we leave the array assignment mostly intact.
      return this.assignee.statementShouldAddParens();
    } else if (expansionIndex === 0) {
      // The first non-expansion assignee will end up on the left side.
      return this.assignee.members[1].statementShouldAddParens();
    } else {
      return this.assignee.members[0].statementShouldAddParens();
    }
  }

  isExpansionAssignment(): boolean {
    return this.getExpansionIndex() !== -1;
  }

  /**
   * If there is an expansion assignment, return the index of the expansion node.
   * Otherwise, return -1.
   */
  getExpansionIndex(): number {
    if (!(this.assignee instanceof ArrayInitialiserPatcher)) {
      return -1;
    }
    for (let i = 0; i < this.assignee.members.length; i++) {
      if (this.assignee.members[i] instanceof ExpansionPatcher) {
        return i;
      }
    }
    return -1;
  }

  patchExpansionAssignment() {
    let expansionIndex = this.getExpansionIndex();
    let assignees = this.assignee.members;
    let expansionNode = assignees[expansionIndex];

    assignees.forEach((assignee, i) => {
      // Patch everything but the expansion node, since expansion nodes expect
      // to not be patched.
      if (i !== expansionIndex) {
        assignee.patch();
      }
    });
    this.expression.patch();
    let expressionCode = this.slice(this.expression.contentStart, this.expression.contentEnd);

    // Easy case: [a, b, ...] = c  ->  [a, b] = c
    if (expansionIndex === assignees.length - 1) {
      let assigneeBeforeExpansion = assignees[assignees.length - 2];
      this.remove(assigneeBeforeExpansion.outerEnd, expansionNode.outerEnd);
      return;
    }

    // Split into independent assignments. For example, the transformation from
    // [a, ..., b, c] = d()
    // to
    // array = d(), a = array[0], b = array[array.length - 2], c = array[array.length - 1];
    //
    // takes these steps:
    // * Remove the "...,".
    // * Insert "array = d(), " on the left.
    // * Remove "["
    // * Insert " = array[index]" after each assignment (the comma is already there).
    // * Remove "] = d()"

    // Remove "...,". We know there's an assignee after the expansion because
    // otherwise we would have returned above.
    this.remove(expansionNode.outerStart, assignees[expansionIndex + 1].outerStart);

    let arrReference;
    if (this.expression.isRepeatable()) {
      arrReference = expressionCode;
    } else {
      arrReference = this.claimFreeBinding('array');
      this.insert(this.outerStart, `${arrReference} = ${expressionCode}, `);
    }

    // Remove opening "[".
    this.remove(this.contentStart, assignees[0].outerStart);

    assignees.forEach((assignee, i) => {
      if (i === expansionIndex) {
        return;
      }
      let key;
      if (i < expansionIndex) {
        key = `${i}`;
      } else {
        key = `${arrReference}.length - ${assignees.length - i}`;
      }
      this.insert(assignee.outerEnd, ` = ${arrReference}[${key}]`);
    });

    // Remove closing "]" and right-side expression.
    this.remove(assignees[assignees.length - 1].outerEnd, this.contentEnd);
  }
}
