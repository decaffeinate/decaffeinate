import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import ExpansionPatcher from './ExpansionPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import SlicePatcher from './SlicePatcher';
import SpreadPatcher from './SpreadPatcher';
import type { PatcherContext } from './../../../patchers/types';

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
    if (this.isSpliceAssignment()) {
      this.patchSpliceAssignment();
    } else if (this.isExpansionAssignment()) {
      this.patchExpansionAssignment();
    } else {
      this.assignee.patch();
      this.expression.patch();
    }
    if (shouldAddParens) {
      this.insert(this.outerEnd, ')');
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

  isSpliceAssignment(): boolean {
    return this.assignee instanceof SlicePatcher;
  }

  patchSpliceAssignment() {
    let slicePatcher: SlicePatcher = this.assignee;
    // `a[b...c] = d` → `a.splice(b, c - b = d`
    //   ^                ^^^^^^^^^^^^^^^^
    slicePatcher.patchAsSpliceExpressionStart();
    // `a.splice(b, c - b = d` → `a.splice(b, c - b, ...[].concat(d`
    //                   ^^^                       ^^^^^^^^^^^^^^^
    this.overwrite(slicePatcher.outerEnd, this.expression.outerStart, ', ...[].concat(');
    let expressionRef = this.expression.patchRepeatable();
    // `a.splice(b, c - b, ...[].concat(d` → `a.splice(b, c - b, ...[].concat(d)), d`
    //                                                                         ^^^^^
    this.insert(this.expression.outerEnd, `)), ${expressionRef}`);
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
   * If there is an expansion assignment, return the index of the expansion
   * node. Note that we also count a non-terminal rest destructure as an
   * expansion node, since the behavior is nearly the same.
   *
   * If none is found, return -1.
   */
  getExpansionIndex(): number {
    if (!(this.assignee instanceof ArrayInitialiserPatcher)) {
      return -1;
    }
    let members = this.assignee.members;
    for (let i = 0; i < members.length; i++) {
      if (members[i] instanceof ExpansionPatcher ||
          (i < members.length - 1 && members[i] instanceof SpreadPatcher)) {
        return i;
      }
    }
    return -1;
  }

  patchExpansionAssignment() {
    let expansionIndex = this.getExpansionIndex();
    let assignees = this.assignee.members;
    let expansionNode = assignees[expansionIndex];

    let expressionCode = this.expression.patchAndGetCode();

    // Easy case: [a, b, ...] = c  ->  [a, b] = c
    if (expansionIndex === assignees.length - 1 &&
        assignees[expansionIndex] instanceof ExpansionPatcher) {
      for (let assignee of assignees.slice(0, -1)) {
        assignee.patch();
      }
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
    // * Insert "array = d(), " on the left.
    // * Remove "["
    // * Insert " = array[index]" after each assignment (the comma is already there).
    // * Remove the "...," when we traverse that assignee.
    // * Remove "] = d()"

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
        if (assignee instanceof ExpansionPatcher) {
          // Don't patch this node, since we'll just remove it. We know there's
          // an assignee after the expansion because otherwise we would have
          // returned above.
          this.remove(assignee.outerStart, assignees[i + 1].outerStart);
        } else if (assignee instanceof SpreadPatcher) {
          // Don't patch the spread itself since the new leading "..." can be a
          // hassle and won't be used anyway. Instead, just patch the underlying
          // expression and get its code.
          let assigneeCode = assignee.expression.patchAndGetCode();
          let sliceEnd = `${arrReference}.length - ${assignees.length - i - 1}`;
          this.overwrite(
            assignee.outerStart, assignee.outerEnd,
            `${assigneeCode} = ${arrReference}.slice(${i}, ${sliceEnd})`
          );
        } else {
          throw this.error('Unexpected expansion node type.');
        }
      } else {
        assignee.patch();
        let key;
        if (i < expansionIndex) {
          key = `${i}`;
        } else {
          key = `${arrReference}.length - ${assignees.length - i}`;
        }
        this.insert(assignee.outerEnd, ` = ${arrReference}[${key}]`);
      }
    });

    // Remove closing "]" and right-side expression.
    this.remove(assignees[assignees.length - 1].outerEnd, this.contentEnd);
  }
}
