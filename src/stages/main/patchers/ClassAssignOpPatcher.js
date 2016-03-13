import ClassBoundMethodFunctionPatcher from './ClassBoundMethodFunctionPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
import ThisPatcher from './ThisPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node } from './../../../patchers/types.js';

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
    this.overwrite(this.key.outerEnd, this.expression.outerStart, ' = ');
    this.patchExpression();
  }

  /**
   * Determines whether this class assignment has a computed key.
   *
   * @protected
   */
  isComputed(): boolean {
    if (!super.isComputed()) {
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
      this.expression.node.type === 'BoundFunction'
    );
  }
}
