import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import ThisPatcher from './ThisPatcher';

export default class ClassAssignOpPatcher extends ObjectBodyMemberPatcher {
  /**
   * Don't put semicolons after methods.
   */
  statementNeedsSemicolon(): boolean {
    return !this.isMethod();
  }

  patch() {
    super.patch();
    if (this.isStaticMethod()) {
      // `this.a: ->` → `static a: ->`
      //  ^^^^^          ^^^^^^^
      let memberNameToken = this.key.getMemberNameToken();
      this.overwrite(this.key.before, memberNameToken.range[0], 'static ');
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
    this.overwrite(this.key.after, this.expression.before, ' = ');
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
}
