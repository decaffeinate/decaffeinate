import ClassPatcher from './ClassPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import babelConstructorWorkaroundLines from '../../../utils/babelConstructorWorkaroundLines';
import getBindingCodeForMethod from '../../../utils/getBindingCodeForMethod';
import getInvalidConstructorErrorMessage from '../../../utils/getInvalidConstructorErrorMessage';
import traverse from '../../../utils/traverse';
import { isFunction } from '../../../utils/types';
import type FunctionPatcher from './FunctionPatcher';
import type NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

export default class ConstructorPatcher extends ObjectBodyMemberPatcher {
  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: FunctionPatcher) {
    super(patcherContext, assignee, expression);

    // Constructor methods do not have implicit returns.
    expression.disableImplicitReturns();
  }

  patch(options={}) {
    this.checkForConstructorErrors();

    if (this.expression.body) {
      let linesToInsert = this.getLinesToInsert();
      this.expression.body.insertStatementsAtIndex(linesToInsert, 0);
      super.patch(options);
    } else {
      super.patch(options);
      let linesToInsert = this.getLinesToInsert();
      if (linesToInsert.length > 0) {
        // As a special case, if there's no function body but we still want to
        // generate bindings, overwrite the function body with the desired
        // contents, since it's sort of hard to insert contents in the middle of
        // the generated {}.
        let indent = this.getIndent();
        let bodyIndent = this.getIndent(1);
        let arrowToken = this.expression.getArrowToken();

        let fullLines = linesToInsert.map(line => `${bodyIndent}${line}\n`);
        let bodyCode = `{\n${fullLines.join('')}${indent}}`;
        this.overwrite(arrowToken.start, this.expression.outerEnd, bodyCode);
      }
    }
  }

  getLinesToInsert(): Array<string> {
    let lines = [];
    if (this.shouldAddBabelWorkaround()) {
      lines = lines.concat(babelConstructorWorkaroundLines);
    }
    lines = lines.concat(this.getBindings());
    return lines;
  }

  /**
   * Give an up-front error if this is a subclass that either omits the `super`
   * call or uses `this` before `super`.
   */
  checkForConstructorErrors() {
    if (this.options.allowInvalidConstructors ||
        this.options.enableBabelConstructorWorkaround) {
      return;
    }

    let errorMessage = this.getInvalidConstructorMessage();
    if (errorMessage) {
      throw this.error(getInvalidConstructorErrorMessage(errorMessage));
    }
  }

  shouldAddBabelWorkaround(): boolean {
    return this.options.enableBabelConstructorWorkaround &&
      this.getInvalidConstructorMessage() !== null;
  }

  /**
   * Return a string with an error if this constructor is invalid (generally one
   * that uses this before super). Otherwise return null.
   */
  getInvalidConstructorMessage(): ?string {
    if (!this.isSubclass()) {
      return null;
    }

    // Any bindings would ideally go before the super call, so if there are any,
    // we'll need this before super.
    if (this.getBindings().length > 0) {
      return 'Cannot automatically convert a subclass that uses bound methods.';
    }

    let superIndex = this.getIndexOfSuperStatement();
    let thisIndex = this.getIndexOfFirstThisStatement();

    if (superIndex === -1) {
      return 'Cannot automatically convert a subclass with a constructor that does not call super.';
    }
    if (thisIndex >= 0 && thisIndex <= superIndex) {
      return 'Cannot automatically convert a subclass with a constructor that uses `this` before `super`.';
    }
    return null;
  }

  getBindings(): Array<string> {
    if (!this._bindings) {
      let boundMethods = this.parent.boundInstanceMethods();
      let bindings = boundMethods.map(getBindingCodeForMethod);
      this._bindings = bindings;
    }
    return this._bindings;
  }

  isSubclass() {
    let enclosingClass = this.parent.parent;
    if (!(enclosingClass instanceof ClassPatcher)) {
      throw this.error('Expected grandparent of ConstructorPatcher to be ClassPatcher.');
    }
    return enclosingClass.isSubclass();
  }

  getIndexOfSuperStatement() {
    if (!this.expression.body) {
      return -1;
    }
    let statements = this.expression.body.statements;
    for (let i = 0; i < statements.length; i++) {
      let callsSuper = false;
      traverse(statements[i].node, child => {
        if (callsSuper) {
          // Already found it, skip this one.
          return false;
        } else if (child.type === 'Super') {
          // Found it.
          callsSuper = true;
        } else if (child.type === 'Class') {
          // Don't go into other classes.
          return false;
        }
      });
      if (callsSuper) {
        return i;
      }
    }
    return -1;
  }

  getIndexOfFirstThisStatement() {
    if (!this.expression.body) {
      return -1;
    }
    let statements = this.expression.body.statements;
    for (let i = 0; i < statements.length; i++) {
      let usesThis = false;
      traverse(statements[i].node, child => {
        if (usesThis) {
          // Already found it, skip this one.
          return false;
        } else if (child.type === 'This') {
          // Found it.
          usesThis = true;
        } else if (child.type === 'Class' || isFunction(child)) {
          // Don't go into other classes or functions.
          return false;
        }
      });
      if (usesThis) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Don't put semicolons after class constructors.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }
}
