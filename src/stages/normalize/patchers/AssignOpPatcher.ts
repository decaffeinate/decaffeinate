import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import containsSuperCall from '../../../utils/containsSuperCall';
import notNull from '../../../utils/notNull';
import ClassPatcher from './ClassPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import FunctionPatcher from './FunctionPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

export interface EarlySuperTransformInfo {
  classCode: string;
  accessCode: string;
}

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext);
    this.assignee = assignee;
    this.expression = expression;
  }

  patchAsExpression(): void {
    this.prepareEarlySuperTransform();
    const isDynamicallyCreatedClassAssignment = this.isDynamicallyCreatedClassAssignment();
    if (isDynamicallyCreatedClassAssignment) {
      this.patchClassAssignmentPrefix();
    }
    this.assignee.patch();
    if (isDynamicallyCreatedClassAssignment) {
      this.patchClassAssignmentOperator();
    }
    this.removeUnnecessaryThenToken();
    this.expression.patch();
  }

  isDynamicallyCreatedClassAssignment(): boolean {
    const classParent = this.getClassParent();
    return (
      classParent !== null &&
      classParent.isClassAssignment(this.node) &&
      !(classParent.isClassMethod(this) && notNull(classParent.body).statements.indexOf(this) > -1)
    );
  }

  patchClassAssignmentPrefix(): void {
    if (this.node.type === 'ClassProtoAssignOp') {
      this.insert(this.assignee.outerStart, '@prototype.');
    }
  }

  patchClassAssignmentOperator(): void {
    const colonIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      (token) => token.type === SourceType.COLON,
    );
    if (colonIndex) {
      const colonToken = notNull(this.sourceTokenAtIndex(colonIndex));
      this.overwrite(colonToken.start, colonToken.end, ' =');
    }
  }

  /**
   * If we are within a class body (not a method), return that class.
   */
  getClassParent(): ClassPatcher | null {
    let parent = this as NodePatcher | null;
    while (parent) {
      if (parent instanceof FunctionPatcher) {
        return null;
      } else if (parent instanceof ClassPatcher) {
        return parent;
      }
      parent = parent.parent;
    }
    return null;
  }

  /**
   * Dynamically-created static methods using super need to be transformed in
   * the normalize stage instead of the main stage. Otherwise, the `super` will
   * resolve to `initClass` instead of the proper static method.
   */
  needsEarlySuperTransform(): boolean {
    if (!this.isDynamicallyCreatedClassAssignment()) {
      return false;
    }
    return (
      this.node.type !== 'ClassProtoAssignOp' &&
      this.expression instanceof FunctionPatcher &&
      containsSuperCall(this.expression.node)
    );
  }

  prepareEarlySuperTransform(): void {
    if (this.needsEarlySuperTransform()) {
      if (this.assignee instanceof MemberAccessOpPatcher) {
        this.assignee.expression.setRequiresRepeatableExpression({
          parens: true,
          ref: 'cls',
          forceRepeat: true,
        });
      } else if (this.assignee instanceof DynamicMemberAccessOpPatcher) {
        this.assignee.expression.setRequiresRepeatableExpression({
          parens: true,
          ref: 'cls',
          forceRepeat: true,
        });
        this.assignee.indexingExpr.setRequiresRepeatableExpression({
          ref: 'method',
          forceRepeat: true,
        });
      } else {
        throw this.error('Unexpected assignee type for early super transform.');
      }
    }
  }

  getEarlySuperTransformInfo(): EarlySuperTransformInfo | null {
    if (this.needsEarlySuperTransform()) {
      if (this.assignee instanceof MemberAccessOpPatcher) {
        return {
          classCode: this.assignee.expression.getRepeatCode(),
          accessCode: `.${this.assignee.member.node.data}`,
        };
      } else if (this.assignee instanceof DynamicMemberAccessOpPatcher) {
        return {
          classCode: this.assignee.expression.getRepeatCode(),
          accessCode: `[${this.assignee.indexingExpr.getRepeatCode()}]`,
        };
      } else {
        throw this.error('Unexpected assignee type for early super transform.');
      }
    }
    return null;
  }

  /**
   * Assignment operators are allowed to have a `then` token after them for some
   * reason, and it doesn't do anything, so just get rid of it.
   */
  removeUnnecessaryThenToken(): void {
    const thenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      (token) => token.type === SourceType.THEN,
    );
    if (thenIndex) {
      const thenToken = notNull(this.sourceTokenAtIndex(thenIndex));
      if (this.slice(thenToken.start - 1, thenToken.start) === ' ') {
        this.remove(thenToken.start - 1, thenToken.end);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }
  }
}
