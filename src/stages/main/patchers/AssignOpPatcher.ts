import { PatcherContext } from '../../../patchers/types';
import {
  REMOVE_ARRAY_FROM,
  SHORTEN_NULL_CHECKS,
  SIMPLIFY_COMPLEX_ASSIGNMENTS,
} from '../../../suggestions';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';
import containsSuperCall from '../../../utils/containsSuperCall';
import extractPrototypeAssignPatchers from '../../../utils/extractPrototypeAssignPatchers';
import NodePatcher from './../../../patchers/NodePatcher';
import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import ConditionalPatcher from './ConditionalPatcher';
import DoOpPatcher from './DoOpPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import ExpansionPatcher from './ExpansionPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher';
import ReturnPatcher from './ReturnPatcher';
import SlicePatcher from './SlicePatcher';
import SpreadPatcher from './SpreadPatcher';
import StringPatcher from './StringPatcher';
import ThisPatcher from './ThisPatcher';

const MULTI_ASSIGN_SINGLE_LINE_MAX_LENGTH = 100;

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;
  negated: boolean = false;
  
  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext);
    this.assignee = assignee;
    this.expression = expression;
  }

  initialize(): void {
    this.assignee.setAssignee();
    this.assignee.setRequiresExpression();
    this.expression.setRequiresExpression();
  }

  negate(): void {
    this.negated = !this.negated;
  }

  patchAsExpression(): void {
    this.markProtoAssignmentRepeatableIfNecessary();
    let shouldAddParens = this.negated ||
      (this.willResultInSeqExpression() &&
        this.parent instanceof FunctionApplicationPatcher) ||
      (!this.isSurroundedByParentheses() &&
        !(this.parent instanceof ReturnPatcher ||
          this.parent instanceof DoOpPatcher ||
          (this.parent instanceof ConditionalPatcher &&
            this.parent.condition === this &&
            !this.parent.willPatchAsTernary())) &&
        !this.implicitlyReturns()
      );
    if (this.negated) {
      this.insert(this.innerStart, '!');
    }
    if (shouldAddParens) {
      this.insert(this.innerStart, '(');
    }

    if (canPatchAssigneeToJavaScript(this.assignee.node)) {
      this.patchSimpleAssignment();
    } else {
      this.addSuggestion(SIMPLIFY_COMPLEX_ASSIGNMENTS);
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
      assignments.push(`${expressionCode}`);

      this.overwrite(this.contentStart, this.contentEnd, assignments.join(', '));
    }

    if (shouldAddParens) {
      this.appendDeferredSuffix(')');
    }
  }

  patchAsStatement(): void {
    this.markProtoAssignmentRepeatableIfNecessary();
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
      this.addSuggestion(SIMPLIFY_COMPLEX_ASSIGNMENTS);
      let assignments = this.generateAssignments(
        this.assignee, this.expression.patchAndGetCode(), this.expression.isRepeatable());
      this.overwriteWithAssignments(assignments);
    }
  }

  willResultInSeqExpression(): boolean {
    return this.willPatchAsExpression() &&
      (!canPatchAssigneeToJavaScript(this.assignee.node) ||
        this.assignee instanceof ArrayInitialiserPatcher);
  }

  patchSimpleAssignment(): void {
    let needsArrayFrom = this.assignee instanceof ArrayInitialiserPatcher;
    this.assignee.patch();
    if (needsArrayFrom) {
      this.addSuggestion(REMOVE_ARRAY_FROM);
      this.insert(this.expression.outerStart, 'Array.from(');
    }

    if (needsArrayFrom) {
      if (this.willPatchAsExpression()) {
        let expressionRepeatCode = this.expression.patchRepeatable();
        this.insert(this.expression.outerEnd, `), ${expressionRepeatCode}`);
      } else {
        this.expression.patch();
        this.insert(this.expression.outerEnd, `)`);
      }
    } else {
      this.expression.patch();
    }
  }

  overwriteWithAssignments(assignments: Array<string>): void {
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
        this.addSuggestion(REMOVE_ARRAY_FROM);
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
      let hasSeenExpansion = false;
      let lengthCode = null;
      let assignments = [];
      for (let [i, assignee] of assignees.entries()) {
        let valueCode;
        if (assignee instanceof ExpansionPatcher || assignee instanceof SpreadPatcher) {
          hasSeenExpansion = true;
          if (assignee instanceof SpreadPatcher && i < assignees.length - 1) {
            lengthCode = this.claimFreeBinding('adjustedLength');
            assignments.push(`${lengthCode} = Math.max(${ref}.length, ${assignees.length - 1})`);
          } else {
            lengthCode = `${ref}.length`;
          }
          valueCode = `${ref}.slice(${i}, ${lengthCode} - ${assignees.length - i - 1})`;
        } else if (hasSeenExpansion) {
          valueCode = `${ref}[${lengthCode} - ${assignees.length - i}]`;
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
          assignments.push(...this.generateAssignments(member.expression || member.key, valueCode, false));
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
      return [patcher.getSpliceCode(ref)];
    } else if (patcher instanceof AssignOpPatcher) {
      this.addSuggestion(SHORTEN_NULL_CHECKS);
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

  /**
   * If this is an assignment of the form `A.prototype.b = -> super`, we need to
   * mark the `A` expression, and possibly the indexed value, as repeatable so
   * that the super transform can make use of it.
   */
  markProtoAssignmentRepeatableIfNecessary(): void {
    if (!(this.expression instanceof FunctionPatcher && containsSuperCall(this.expression.node))) {
      return;
    }
    let prototypeAssignPatchers = extractPrototypeAssignPatchers(this);
    if (!prototypeAssignPatchers) {
      return;
    }
    let { classRefPatcher, methodAccessPatcher } = prototypeAssignPatchers;
    classRefPatcher.setRequiresRepeatableExpression({
      parens: true,
      ref: 'cls',
      forceRepeat: true,
    });
    if (methodAccessPatcher instanceof DynamicMemberAccessOpPatcher) {
      methodAccessPatcher.indexingExpr.setRequiresRepeatableExpression({
        ref: 'method',
        forceRepeat: true,
      });
    }
  }
}
