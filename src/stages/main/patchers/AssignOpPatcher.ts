import { PatcherContext } from '../../../patchers/types';
import { REMOVE_ARRAY_FROM, SHORTEN_NULL_CHECKS, SIMPLIFY_COMPLEX_ASSIGNMENTS } from '../../../suggestions';
import canPatchAssigneeToJavaScript from '../../../utils/canPatchAssigneeToJavaScript';
import containsSuperCall from '../../../utils/containsSuperCall';
import extractPrototypeAssignPatchers from '../../../utils/extractPrototypeAssignPatchers';
import getObjectAssigneeKeys from '../../../utils/getObjectAssigneeKeys';
import NodePatcher from './../../../patchers/NodePatcher';
import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import ConditionalPatcher from './ConditionalPatcher';
import DoOpPatcher from './DoOpPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import ElisionPatcher from './ElisionPatcher';
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

const OBJECT_WITHOUT_KEYS_HELPER = `function __objectWithoutKeys__(object, keys) {
  const result = {...object};
  for (const k of keys) {
    delete result[keys];
  }
  return result;
}`;

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;
  negated = false;

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
    if (this.parent instanceof ObjectInitialiserPatcher) {
      this.patchAsObjectDestructureWithDefault();
      return;
    }

    this.markProtoAssignmentRepeatableIfNecessary();
    const shouldAddParens =
      !this.isAssignee() &&
      (this.negated ||
        (this.willResultInSeqExpression() && this.parent instanceof FunctionApplicationPatcher) ||
        (!this.isSurroundedByParentheses() &&
          !(
            this.parent instanceof ReturnPatcher ||
            this.parent instanceof DoOpPatcher ||
            (this.parent instanceof ConditionalPatcher &&
              this.parent.condition === this &&
              !this.parent.willPatchAsTernary())
          ) &&
          !this.implicitlyReturns()));
    if (this.negated) {
      this.insert(this.innerStart, '!');
    }
    if (shouldAddParens) {
      this.insert(this.innerStart, '(');
    }

    if (canPatchAssigneeToJavaScript(this.assignee.node, this.options)) {
      this.patchSimpleAssignment();
    } else {
      this.addSuggestion(SIMPLIFY_COMPLEX_ASSIGNMENTS);
      const assignments = [];

      // In an expression context, the result should always be the value of the
      // RHS, so we need to make it repeatable if it's not.
      let expressionCode;
      if (this.expression.isRepeatable()) {
        expressionCode = this.expression.patchAndGetCode();
      } else {
        const fullExpression = this.expression.patchAndGetCode();
        expressionCode = this.claimFreeBinding();
        assignments.push(`${expressionCode} = ${fullExpression}`);
      }
      assignments.push(...this.generateAssignments(this.assignee, expressionCode, true));
      assignments.push(`${expressionCode}`);

      this.overwrite(this.contentStart, this.contentEnd, assignments.join(', '));
    }

    if (shouldAddParens) {
      this.appendDeferredSuffix(')');
    }
  }

  patchAsStatement(): void {
    this.markProtoAssignmentRepeatableIfNecessary();
    if (canPatchAssigneeToJavaScript(this.assignee.node, this.options)) {
      const shouldAddParens = this.assignee.statementShouldAddParens();
      if (shouldAddParens) {
        this.insert(this.contentStart, '(');
      }
      this.patchSimpleAssignment();
      if (shouldAddParens) {
        this.insert(this.contentEnd, ')');
      }
    } else {
      this.addSuggestion(SIMPLIFY_COMPLEX_ASSIGNMENTS);
      const assignments = this.generateAssignments(
        this.assignee,
        this.expression.patchAndGetCode(),
        this.expression.isRepeatable(),
      );
      this.overwriteWithAssignments(assignments);
    }
  }

  private patchAsObjectDestructureWithDefault(): void {
    if (this.assignee instanceof MemberAccessOpPatcher && this.assignee.expression instanceof ThisPatcher) {
      // `{ @a = b }` → `{ a: @a = bb }`
      //                  ^^^^
      this.insert(this.assignee.outerStart, `${this.assignee.getMemberName()}: `);
    }
    this.assignee.patch();
    this.expression.patch();
  }

  willResultInSeqExpression(): boolean {
    return (
      this.willPatchAsExpression() &&
      (!canPatchAssigneeToJavaScript(this.assignee.node, this.options) ||
        this.assignee instanceof ArrayInitialiserPatcher)
    );
  }

  patchSimpleAssignment(): void {
    const needsArrayFrom = this.shouldUseArrayFrom() && this.assignee instanceof ArrayInitialiserPatcher;
    this.assignee.patch();
    if (needsArrayFrom) {
      this.addSuggestion(REMOVE_ARRAY_FROM);
      this.insert(this.expression.outerStart, 'Array.from(');
    }

    if (needsArrayFrom) {
      if (this.willPatchAsExpression()) {
        const expressionRepeatCode = this.expression.patchRepeatable();
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
    if (patcher instanceof ExpansionPatcher) {
      // Expansions don't produce assignments.
      return [];
    } else if (patcher instanceof ElisionPatcher) {
      // Elisions don't produce assignments.
      return [];
    } else if (canPatchAssigneeToJavaScript(patcher.node, this.options)) {
      const assigneeCode = patcher.patchAndGetCode();
      if (this.shouldUseArrayFrom() && patcher instanceof ArrayInitialiserPatcher) {
        this.addSuggestion(REMOVE_ARRAY_FROM);
        return [`${assigneeCode} = Array.from(${ref})`];
      } else {
        return [`${assigneeCode} = ${ref}`];
      }
    } else if (patcher instanceof SpreadPatcher) {
      // Calling code seeing a spread patcher should provide an expression for
      // the resolved array.
      return this.generateAssignments(patcher.expression, ref, refIsRepeatable);
    } else if (patcher instanceof ArrayInitialiserPatcher) {
      if (!refIsRepeatable) {
        const arrReference = this.claimFreeBinding('array');
        return [`${arrReference} = ${ref}`, ...this.generateAssignments(patcher, arrReference, true)];
      }

      const assignees = patcher.members;
      let lengthCode: string | null = null;
      const assignments = [];
      for (const [i, assignee] of assignees.entries()) {
        let valueCode;
        if (assignee instanceof ExpansionPatcher || assignee instanceof SpreadPatcher) {
          if (assignee instanceof SpreadPatcher && i < assignees.length - 1) {
            lengthCode = this.claimFreeBinding('adjustedLength');
            assignments.push(`${lengthCode} = Math.max(${ref}.length, ${assignees.length - 1})`);
          } else {
            lengthCode = `${ref}.length`;
          }
          valueCode = `${ref}.slice(${i}, ${lengthCode} - ${assignees.length - i - 1})`;
        } else if (typeof lengthCode === 'string') {
          valueCode = `${ref}[${lengthCode} - ${assignees.length - i}]`;
        } else {
          valueCode = `${ref}[${i}]`;
        }
        assignments.push(...this.generateAssignments(assignee, valueCode, false));
      }
      return assignments;
    } else if (patcher instanceof ObjectInitialiserPatcher) {
      if (!refIsRepeatable) {
        const objReference = this.claimFreeBinding('obj');
        return [`${objReference} = ${ref}`, ...this.generateAssignments(patcher, objReference, true)];
      }

      const assignments = [];
      for (const member of patcher.members) {
        if (member instanceof ObjectInitialiserMemberPatcher) {
          const valueCode = `${ref}${this.accessFieldForObjectDestructure(member.key)}`;
          assignments.push(...this.generateAssignments(member.expression || member.key, valueCode, false));
        } else if (member instanceof AssignOpPatcher) {
          // Assignments like {a = b} = c end up as an assign op.
          const valueCode = `${ref}${this.accessFieldForObjectDestructure(member.assignee)}`;
          assignments.push(...this.generateAssignments(member, valueCode, false));
        } else if (member instanceof SpreadPatcher) {
          const helper = this.registerHelper('__objectWithoutKeys__', OBJECT_WITHOUT_KEYS_HELPER);
          const omittedKeysCode = getObjectAssigneeKeys(patcher)
            .map((key) => `'${key}'`)
            .join(', ');
          assignments.push(...this.generateAssignments(member, `${helper}(${ref}, [${omittedKeysCode}])`, false));
        } else {
          throw this.error(`Unexpected object initializer member: ${(member as NodePatcher).node.type}`);
        }
      }
      return assignments;
    } else if (patcher instanceof SlicePatcher) {
      return [patcher.getSpliceCode(ref)];
    } else if (patcher instanceof AssignOpPatcher) {
      this.addSuggestion(SHORTEN_NULL_CHECKS);
      if (!refIsRepeatable) {
        const valReference = this.claimFreeBinding('val');
        return [`${valReference} = ${ref}`, ...this.generateAssignments(patcher, valReference, true)];
      }
      const defaultCode = patcher.expression.patchAndGetCode();
      const comparison = this.options.useCS2 ? '!== undefined' : '!= null';
      return this.generateAssignments(patcher.assignee, `${ref} ${comparison} ? ${ref} : ${defaultCode}`, false);
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
    const prototypeAssignPatchers = extractPrototypeAssignPatchers(this);
    if (!prototypeAssignPatchers) {
      return;
    }
    const { classRefPatcher, methodAccessPatcher } = prototypeAssignPatchers;
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

  shouldUseArrayFrom(): boolean {
    return !this.options.useCS2;
  }
}
