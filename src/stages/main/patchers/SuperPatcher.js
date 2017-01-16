import { SourceType } from 'coffee-lex';

import NodePatcher from './../../../patchers/NodePatcher';
import AssignOpPatcher from './AssignOpPatcher';
import ClassPatcher from './ClassPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import ConstructorPatcher from './ConstructorPatcher';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

import type { SourceToken } from './../../../patchers/types';

type MethodInfo = {
  className: string;
  // If null, this is a constructor.
  methodName: ?string;
}

/**
 * Transform CS super to JS super. For constructors, we can keep the form
 * `super(a, b, c)`, but for methods, we need to insert the method name, e.g.
 * `super.foo(a, b, c)`. However, there are some cases where CS allows super
 * calls but JS doesn't, so in those cases, we find the class and method name
 * using CS's algorithm and insert a more direct prototype method call.
 */
export default class SuperPatcher extends NodePatcher {
  patchAsExpression() {
    let { className, methodName } = this.getEnclosingMethodInfo();
    if (this.canConvertToJsSuper()) {
      if (methodName) {
        this.insert(this.contentEnd, `.${methodName}`);
      }
    } else {
      if (!methodName) {
        throw this.error(
          'Cannot handle a super call in an inner function in a constructor. ' +
          'Please either rewrite your CoffeeScript code to not use this ' +
          'construct or file a bug to discuss ways that decaffeinate could ' +
          'handle this case.');
      }
      let openParenToken = this.getFollowingOpenParenToken();
      this.overwrite(this.contentStart, openParenToken.end,
        `${className}.prototype.__proto__.${methodName}.call(this, `);
    }
  }

  /**
   * @private
   */
  getEnclosingMethodInfo(): MethodInfo {
    let methodAssignment = this.getEnclosingMethodAssignment();
    if (methodAssignment instanceof ClassAssignOpPatcher) {
      let methodName;
      if (methodAssignment.isStaticMethod()) {
        methodName = methodAssignment.key.node.member.data;
      } else {
        methodName = methodAssignment.key.node.data;
      }
      return {
        className: this.getEnclosingClassName(methodAssignment),
        methodName,
      };
    } else if (methodAssignment instanceof ConstructorPatcher) {
      return {
        className: this.getEnclosingClassName(methodAssignment),
        methodName: null,
      };
    } else {
      let methodInfo = this.getPrototypeAssignInfo(methodAssignment);
      if (!methodInfo) {
        throw this.error(
          'Expected a valid method assignment from getEnclosingMethodAssignment.'
        );
      }
      return methodInfo;
    }
  }

  /**
   * @private
   */
  getEnclosingClassName(patcher: NodePatcher): string {
    let { parent } = patcher;
    while (parent) {
      if (parent instanceof ClassPatcher) {
        let name = parent.getName();
        if (!name) {
          throw this.error(
            'Expected super call to exist in a class with an identifiable name.'
          );
        }
        return name;
      }
      parent = parent.parent;
    }
    throw this.error('Expected super expression to be in a class body.');
  }

  /**
   * @private
   */
  getEnclosingMethodAssignment(): NodePatcher {
    let { parent } = this;
    while (parent) {
      if (parent instanceof ClassAssignOpPatcher ||
          parent instanceof ConstructorPatcher ||
          this.getPrototypeAssignInfo(parent) !== null) {
        return parent;
      }
      parent = parent.parent;
    }
    throw this.error(
      'super called in a context where we cannot determine the class and method name.'
    );
  }

  /**
   * Extract the 'A' and 'b' from a node like `A.prototype.b = -> c`, if it
   * matches that form. Return null otherwise.
   *
   * @private
   */
  getPrototypeAssignInfo(patcher: NodePatcher): ?MethodInfo {
    if (!(patcher instanceof AssignOpPatcher) ||
        !(patcher.expression instanceof FunctionPatcher) ||
        !(patcher.assignee instanceof MemberAccessOpPatcher) ||
        !(patcher.assignee.expression instanceof MemberAccessOpPatcher) ||
        !(patcher.assignee.expression.expression instanceof IdentifierPatcher) ||
        !(patcher.assignee.expression.member.node.date !== 'prototype')) {
      return null;
    }
    return {
      className: patcher.assignee.expression.expression.node.data,
      methodName: patcher.assignee.member.node.data,
    };
  }

  /**
   * JavaScript super is more limited than CoffeeScript super, so in some cases
   * we need to write out an expanded version that uses the method on the
   * prototype. In particular:
   *
   * - CoffeeScript allows method assignments like `A::b = -> super`, and is
   *   able to determine the class and method name from code written like this.
   * - CoffeeScript allows `super` from nested methods (which end up compiling
   *   to use whatever `arguments` is relevant at that point in code if the
   *   `super` is written without args).
   *
   * @private
   */
  canConvertToJsSuper() {
    let methodAssignment = this.getEnclosingMethodAssignment();
    if (methodAssignment instanceof ConstructorPatcher ||
        methodAssignment instanceof ClassAssignOpPatcher) {
      return methodAssignment.expression === this.getEnclosingFunction();
    }
    return false;
  }

  /**
   * @private
   */
  getEnclosingFunction(): NodePatcher {
    let { parent } = this;
    while (parent) {
      if (parent instanceof FunctionPatcher) {
        return parent;
      }
      parent = parent.parent;
    }
    throw this.error('super called outside of a function.');
  }

  /**
   * @private
   */
  getFollowingOpenParenToken(): SourceToken {
    let openParenTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
      this.contentEndTokenIndex, SourceType.CALL_START);
    if (!openParenTokenIndex) {
      throw this.error('Expected open-paren after super.');
    }
    return this.sourceTokenAtIndex(openParenTokenIndex);
  }
}
