import { SourceType } from 'coffee-lex';
import ClassPatcher from './ClassPatcher';
import FunctionPatcher from './FunctionPatcher';
import NodePatcher from '../../../patchers/NodePatcher';

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: NodePatcher) {
    super(patcherContext, assignee, expression);
    this.assignee = assignee;
    this.expression = expression;
  }

  patchAsExpression() {
    let classParent = this.getClassParent();
    let isClassAssignment = classParent &&
      classParent.isClassAssignment(this.node) &&
      !(classParent.isClassMethod(this) && classParent.body.statements.indexOf(this) > -1);

    if (isClassAssignment) {
      this.patchClassAssignmentPrefix();
    }
    this.assignee.patch();
    if (isClassAssignment) {
      this.patchClassAssignmentOperator();
    }
    this.removeUnnecessaryThenToken();
    this.expression.patch();
  }

  patchClassAssignmentPrefix() {
    if (this.node.type === 'ClassProtoAssignOp') {
      this.insert(this.assignee.outerStart, '@prototype.');
    }
  }

  patchClassAssignmentOperator() {
    let colonIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      token => token.type === SourceType.COLON
    );
    if (colonIndex) {
      let colonToken = this.sourceTokenAtIndex(colonIndex);
      this.overwrite(colonToken.start, colonToken.end, ' =');
    }
  }

  /**
   * If we are within a class body (not a method), return that class.
   */
  getClassParent() {
    let parent = this;
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
   * Assignment operators are allowed to have a `then` token after them for some
   * reason, and it doesn't do anything, so just get rid of it.
   */
  removeUnnecessaryThenToken() {
    let thenIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      token => token.type === SourceType.THEN
    );
    if (thenIndex) {
      let thenToken = this.sourceTokenAtIndex(thenIndex);
      if (this.slice(thenToken.start - 1, thenToken.start) === ' ') {
        this.remove(thenToken.start - 1, thenToken.end);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }
  }
}
