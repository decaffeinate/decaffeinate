import ClassBlockPatcher from './ClassBlockPatcher';
import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class ClassPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, nameAssignee: ?NodePatcher, parent: ?NodePatcher, body: ?ClassBlockPatcher) {
    super(node, context, editor);
    this.nameAssignee = nameAssignee;
    this.superclass = parent;
    this.body = body;
  }

  static patcherClassForChildNode(node: Node, property: string): ?Function {
    if (property === 'body') {
      return ClassBlockPatcher;
    }
    return null;
  }

  initialize() {
    if (this.nameAssignee) {
      this.nameAssignee.setRequiresExpression();
    }
    if (this.superclass) {
      this.superclass.setRequiresExpression();
    }
  }

  patchAsStatement() {
    let hasParens = this.isSurroundedByParentheses();
    let anonymous = this.isAnonymous();
    if (anonymous && !hasParens) {
      // `class` → `(class`
      //            ^
      this.insertBefore('(');
    }

    this.patchAsExpression();

    if (anonymous && !hasParens) {
      // `(class` → `(class)`
      //                   ^
      this.insertAfter(')');
    }
  }

  patchAsExpression() {
    if (this.nameAssignee) {
      this.nameAssignee.patch();
    }
    if (this.superclass) {
      this.superclass.patch();
    }
    if (!this.body) {
      // `class A` → `class A {}`
      //                     ^^^
      this.insertAtEnd(' {}');
    } else {
      // `class A` → `class A {`
      //                     ^^
      this.insert(this.getBraceInsertionOffset(), ' {');
      this.body.patch({ leftBrace: false });
    }
  }

  statementNeedsSemicolon(): boolean {
    return this.isAnonymous();
  }

  /**
   * @private
   */
  isAnonymous(): boolean {
    return this.nameAssignee === null;
  }

  /**
   * @private
   */
  getBraceInsertionOffset(): number {
    if (this.superclass) {
      return this.superclass.after;
    }

    if (this.nameAssignee) {
      return this.nameAssignee.after;
    }

    let classToken = this.context.tokenAtIndex(this.startTokenIndex);
    if (classToken.type !== 'CLASS') {
      throw this.error(
        `expected CLASS token but found ${classToken.type}`,
        ...classToken.range
      );
    }
    return classToken.range[1];
  }
}
