import ClassBlockPatcher from './ClassBlockPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, PatcherContext } from './../../../patchers/types.js';
import { CLASS } from 'coffee-lex';

export default class ClassPatcher extends NodePatcher {
  nameAssignee: ?NodePatcher;
  superclass: ?NodePatcher;
  body: ?ClassBlockPatcher;

  constructor(patcherContext: PatcherContext, nameAssignee: ?NodePatcher, parent: ?NodePatcher, body: ?ClassBlockPatcher) {
    super(patcherContext);
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
      this.insert(this.innerStart, '(');
    }

    this.patchAsExpression();

    if (anonymous && !hasParens) {
      // `(class` → `(class)`
      //                   ^
      this.insert(this.innerEnd, ')');
    }
  }

  patchAsExpression() {
    if (this.isNamespaced()) {
      let classToken = this.getClassToken();
      // `class A.B` → `A.B`
      //  ^^^^^^
      this.remove(classToken.start, this.nameAssignee.outerStart);
      let name = this.getName();
      if (name) {
        // `A.B` → `A.B = class B`
        //             ^^^^^^^^^^
        this.insert(this.nameAssignee.outerEnd, ` = class ${this.getName()}`);
      } else {
        // `A[0]` → `A[0] = class`
        //               ^^^^^^^^
        this.insert(this.nameAssignee.outerEnd, ` = class`);
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
      this.insert(this.innerEnd,' {}');
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
   * Classes, like functions, only need parens as statements when anonymous.
   */
  statementNeedsParens(): boolean {
    return this.isAnonymous();
  }

  /**
   * @private
   */
  getClassToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let classSourceToken = tokens.tokenAtIndex(this.contentStartTokenIndex);
    if (classSourceToken.type !== CLASS) {
      throw this.error(
        `expected CLASS token but found ${classSourceToken.type.name}`,
        classSourceToken.start, classSourceToken.end
      );
    }
    return classSourceToken;
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
      return this.superclass.outerEnd;
    }

    if (this.nameAssignee) {
      return this.nameAssignee.outerEnd;
    }

    return this.getClassToken().end;
  }
}
