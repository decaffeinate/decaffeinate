import { Node } from 'decaffeinate-parser';
import { PatchOptions } from '../../../patchers/types';
import adjustIndent from '../../../utils/adjustIndent';
import getBindingCodeForMethod from '../../../utils/getBindingCodeForMethod';
import getInvalidConstructorErrorMessage from '../../../utils/getInvalidConstructorErrorMessage';
import { PatcherClass } from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import ClassPatcher from './ClassPatcher';
import ConstructorPatcher from './ConstructorPatcher';
import { FIX_INVALID_CONSTRUCTOR } from '../../../suggestions';

export default class ClassBlockPatcher extends BlockPatcher {
  static patcherClassForChildNode(node: Node, property: string): PatcherClass | null {
    if (property === 'statements' && node.type === 'AssignOp') {
      return ClassAssignOpPatcher;
    }
    return null;
  }

  patch(options: PatchOptions = {}): void {
    for (const boundMethod of this.boundInstanceMethods()) {
      boundMethod.key.setRequiresRepeatableExpression();
    }

    super.patch(options);

    if (!this.hasConstructor()) {
      const boundMethods = this.boundInstanceMethods();
      if (boundMethods.length > 0) {
        const isSubclass = this.getClassPatcher().isSubclass();
        if (!this.options.useCS2) {
          if (isSubclass && !this.shouldAllowInvalidConstructors()) {
            throw this.error(
              getInvalidConstructorErrorMessage('Cannot automatically convert a subclass that uses bound methods.'),
            );
          } else if (isSubclass) {
            this.addSuggestion(FIX_INVALID_CONSTRUCTOR);
          }
        }

        const { source } = this.context;
        const insertionPoint = this.statements[0].outerStart;
        const methodIndent = adjustIndent(source, insertionPoint, 0);
        const methodBodyIndent = adjustIndent(source, insertionPoint, 1);
        let constructor = '';
        if (isSubclass) {
          constructor += `constructor(...args) {\n`;
        } else {
          constructor += `constructor() {\n`;
        }
        const bindingStatements = boundMethods
          .map((method) => `${methodBodyIndent}${getBindingCodeForMethod(method)};\n`)
          .join('');
        if (isSubclass) {
          const superStatement = `${methodBodyIndent}super(...args)\n`;

          if (this.options.useCS2) {
            // The behavior is different in CS2. Binding happens after `super`.
            constructor += superStatement + bindingStatements;
          } else {
            constructor += bindingStatements + superStatement;
          }
        } else {
          constructor += bindingStatements;
        }
        constructor += `${methodIndent}}\n\n${methodIndent}`;
        this.prependLeft(insertionPoint, constructor);
      }
    }
  }

  shouldAllowInvalidConstructors(): boolean {
    return !this.options.disallowInvalidConstructors;
  }

  getClassPatcher(): ClassPatcher {
    if (!(this.parent instanceof ClassPatcher)) {
      throw this.error('Expected class block parent to be a class.');
    }
    return this.parent;
  }

  canPatchAsExpression(): boolean {
    return false;
  }

  hasConstructor(): boolean {
    return this.statements.some((statement) => statement instanceof ConstructorPatcher);
  }

  boundInstanceMethods(): Array<ClassAssignOpPatcher> {
    const boundMethods = [];
    for (const statement of this.statements) {
      if (statement instanceof ClassAssignOpPatcher && statement.isBoundInstanceMethod()) {
        boundMethods.push(statement);
      }
    }
    return boundMethods;
  }
}
