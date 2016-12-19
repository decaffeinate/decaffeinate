import ClassBoundMethodFunctionPatcher from './ClassBoundMethodFunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import ThisPatcher from './ThisPatcher';
import type NodePatcher from './../../../patchers/NodePatcher';
import type { Node } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class ClassAssignOpPatcher extends ObjectBodyMemberPatcher {
  static patcherClassForChildNode(node: Node, property: string): ?Class<NodePatcher> {
    if (property === 'expression' && node.type === 'BoundFunction') {
      return ClassBoundMethodFunctionPatcher;
    }
    return null;
  }

  /**
   * Don't put semicolons after methods.
   */
  statementNeedsSemicolon(): boolean {
    return !this.isMethod();
  }

  patchAsExpression() {
    super.patchAsExpression();
    if (this.isStaticMethod()) {
      // `this.a: ->` → `static a: ->`
      //  ^^^^^          ^^^^^^^
      let memberNameToken = this.key.getMemberNameSourceToken();
      this.overwrite(this.key.outerStart, memberNameToken.start, 'static ');
    }
  }

  /**
   * @protected
   */
  patchKey() {
    // Don't bother, we handle it at this level.
  }

  /**
   * @protected
   */
  patchAsProperty() {
    // `name: null` → `name = null`
    //      ^^             ^^^
    let colonIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.key,
      this.expression,
      token => token.type === SourceType.COLON
    );
    if (!colonIndex) {
      throw this.error('expected a colon between the key and expression of a class property');
    }
    let colonToken = this.sourceTokenAtIndex(colonIndex);
    this.overwrite(colonToken.start, colonToken.end, ' =');
    this.patchExpression();
  }

  /**
   * Determines whether this class assignment has a computed key.
   *
   * @protected
   */
  isMethodNameComputed(): boolean {
    if (!super.isMethodNameComputed()) {
      return false;
    }
    return !this.isStaticMethod();
  }

  /**
   * Determines if this class assignment matches the known patterns for static
   * methods in CoffeeScript, i.e.
   *
   *   class A
   *     this.a: ->
   *     @b: ->
   *     A.c: ->
   *
   * @protected
   */
  isStaticMethod(): boolean {
    if (!(this.key instanceof MemberAccessOpPatcher)) {
      return false;
    }

    let memberObject = this.key.expression;
    if (memberObject instanceof ThisPatcher) {
      return true;
    }

    let className = this.parent.parent.nameAssignee;
    return (
      className instanceof IdentifierPatcher &&
      memberObject instanceof IdentifierPatcher &&
      className.node.data === className.node.data
    );
  }

  isBoundInstanceMethod(): boolean {
    return (
      !this.isStaticMethod() &&
      (this.expression.node.type === 'BoundFunction' ||
        this.expression.node.type === 'BoundGeneratorFunction')
    );
  }

  /**
   * For classes, unlike in objects, manually bound methods can use regular
   * method syntax because the bind happens in the constructor.
   *
   * @protected
   */
  isMethod(): boolean {
    return this.expression instanceof ManuallyBoundFunctionPatcher ||
      super.isMethod();
  }
}
