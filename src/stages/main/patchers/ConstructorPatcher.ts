import { Class, This } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import { FIX_INVALID_CONSTRUCTOR } from '../../../suggestions';
import containsDescendant from '../../../utils/containsDescendant';
import containsSuperCall from '../../../utils/containsSuperCall';
import getBindingCodeForMethod from '../../../utils/getBindingCodeForMethod';
import getInvalidConstructorErrorMessage from '../../../utils/getInvalidConstructorErrorMessage';
import { isFunction } from '../../../utils/types';
import ClassBlockPatcher from './ClassBlockPatcher';
import ClassPatcher from './ClassPatcher';
import FunctionPatcher from './FunctionPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';

export default class ConstructorPatcher extends ObjectBodyMemberPatcher {
  expression!: FunctionPatcher;

  _bindings: Array<string> | null = null;

  constructor(patcherContext: PatcherContext, assignee: NodePatcher, expression: FunctionPatcher) {
    super(patcherContext, assignee, expression);

    // Constructor methods do not have implicit returns.
    expression.disableImplicitReturns();
  }

  patch(options: PatchOptions = {}): void {
    this.checkForConstructorErrors();

    if (this.expression.body) {
      const linesToInsert = this.getLinesToInsert();
      this.expression.body.insertStatementsAtIndex(linesToInsert, 0);
      super.patch(options);
    } else {
      super.patch(options);
      const linesToInsert = this.getLinesToInsert();
      if (linesToInsert.length > 0) {
        // As a special case, if there's no function body but we still want to
        // generate bindings, overwrite the function body with the desired
        // contents, since it's sort of hard to insert contents in the middle of
        // the generated {}.
        const indent = this.getIndent();
        const bodyIndent = this.getIndent(1);
        const arrowToken = this.expression.getArrowToken();

        const fullLines = linesToInsert.map((line) => `${bodyIndent}${line}\n`);
        const bodyCode = `{\n${fullLines.join('')}${indent}}`;
        this.overwrite(arrowToken.start, this.expression.outerEnd, bodyCode);
      }
    }
  }

  getLinesToInsert(): Array<string> {
    let lines: Array<string> = [];
    lines = lines.concat(this.getBindings());
    return lines;
  }

  /**
   * Give an up-front error if this is a subclass that either omits the `super`
   * call or uses `this` before `super`.
   */
  checkForConstructorErrors(): void {
    const errorMessage = this.getInvalidConstructorMessage();

    if (errorMessage) {
      if (!this.options.disallowInvalidConstructors) {
        this.addSuggestion(FIX_INVALID_CONSTRUCTOR);
      } else {
        throw this.error(getInvalidConstructorErrorMessage(errorMessage));
      }
    }
  }

  /**
   * Return a string with an error if this constructor is invalid (generally one
   * that uses this before super). Otherwise return null.
   */
  getInvalidConstructorMessage(): string | null {
    if (!this.getEnclosingClassPatcher().isSubclass()) {
      return null;
    }

    // Any bindings would ideally go before the super call, so if there are any,
    // we'll need this before super.
    if (this.getBindings().length > 0) {
      return 'Cannot automatically convert a subclass that uses bound methods.';
    }

    const superIndex = this.getIndexOfSuperStatement();
    const thisIndex = this.getIndexOfFirstThisStatement();

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
      const boundMethods = this.getEnclosingClassBlockPatcher().boundInstanceMethods();
      const bindings = boundMethods.map(getBindingCodeForMethod);
      this._bindings = bindings;
    }
    return this._bindings;
  }

  getEnclosingClassPatcher(): ClassPatcher {
    const enclosingClassBlock = this.getEnclosingClassBlockPatcher();
    if (!(enclosingClassBlock.parent instanceof ClassPatcher)) {
      throw this.error('Expected grandparent of ConstructorPatcher to be ClassPatcher.');
    }
    return enclosingClassBlock.parent;
  }

  getEnclosingClassBlockPatcher(): ClassBlockPatcher {
    if (!(this.parent instanceof ClassBlockPatcher)) {
      throw this.error('Expected parent of ConstructorPatcher to be ClassBlockPatcher.');
    }
    return this.parent;
  }

  getIndexOfSuperStatement(): number {
    if (!this.expression.body) {
      return -1;
    }
    const statements = this.expression.body.statements;
    for (let i = 0; i < statements.length; i++) {
      if (containsSuperCall(statements[i].node)) {
        return i;
      }
    }
    return -1;
  }

  getIndexOfFirstThisStatement(): number {
    if (!this.expression.body) {
      return -1;
    }
    const statements = this.expression.body.statements;
    for (let i = 0; i < statements.length; i++) {
      const usesThis = containsDescendant(statements[i].node, (child) => child instanceof This, {
        shouldStopTraversal: (child) => child instanceof Class || isFunction(child),
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
