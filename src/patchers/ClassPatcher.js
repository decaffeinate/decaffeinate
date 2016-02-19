import ClassBlockPatcher from './ClassBlockPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import NodePatcher from './NodePatcher';
import type { Token, Node, ParseContext, Editor } from './types';

export default class ClassPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, nameAssignee: ?NodePatcher, parent: ?NodePatcher, body: ?ClassBlockPatcher) {
    super(node, context, editor);
    this.nameAssignee = nameAssignee;
    this.superclass = parent;
    this.body = body;
  }

  static patcherClassForChildNode(node: Node, property: string): ?Class<NodePatcher> {
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
    if (this.isNamespaced()) {
      let classToken = this.getClassToken();
      // `class A.B` → `A.B`
      //  ^^^^^^
      this.remove(classToken.range[0], this.nameAssignee.before);
      let name = this.getName();
      if (name) {
        // `A.B` → `A.B = class B`
        //             ^^^^^^^^^^
        this.insert(this.nameAssignee.after, ` = class ${this.getName()}`);
      } else {
        // `A[0]` → `A[0] = class`
        //               ^^^^^^^^
        this.insert(this.nameAssignee.after, ` = class`);
      }
    }
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
    return this.isAnonymous() || this.isNamespaced();
  }

  /**
   * @private
   */
  getClassToken(): Token {
    let token = this.context.tokenAtIndex(this.startTokenIndex);
    if (token.type !== 'CLASS') {
      throw this.error(
        `unexpected leading token for class: ${token.type}`,
        ...token.range
      );
    }
    return token;
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
  isNamespaced(): boolean {
    return !this.isAnonymous() && !(this.nameAssignee instanceof IdentifierPatcher);
  }

  /**
   * @private
   */
  getName(): ?string {
    let { nameAssignee } = this;
    if (nameAssignee instanceof IdentifierPatcher) {
      return nameAssignee.node.data;
    } else if (nameAssignee instanceof MemberAccessOpPatcher) {
      return nameAssignee.node.memberName;
    } else {
      return null;
    }
  }

  isSubclass(): boolean {
    return this.superclass !== null;
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
