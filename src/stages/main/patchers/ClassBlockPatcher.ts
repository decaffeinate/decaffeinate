import { Node } from 'decaffeinate-parser/dist/nodes';
import { PatchOptions } from '../../../patchers/types';
import { REMOVE_BABEL_WORKAROUND } from '../../../suggestions';
import adjustIndent from '../../../utils/adjustIndent';
import babelConstructorWorkaroundLines from '../../../utils/babelConstructorWorkaroundLines';
import getBindingCodeForMethod from '../../../utils/getBindingCodeForMethod';
import getInvalidConstructorErrorMessage from '../../../utils/getInvalidConstructorErrorMessage';
import { PatcherClass } from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import ClassPatcher from './ClassPatcher';
import ConstructorPatcher from './ConstructorPatcher';

export default class ClassBlockPatcher extends BlockPatcher {
  static patcherClassForChildNode(node: Node, property: string): PatcherClass | null {
    if (property === 'statements' && node.type === 'AssignOp') {
      return ClassAssignOpPatcher;
    }
    return null;
  }

  patch(options: PatchOptions = {}): void {
    for (let boundMethod of this.boundInstanceMethods()) {
      boundMethod.key.setRequiresRepeatableExpression();
    }

    super.patch(options);

    if (!this.hasConstructor()) {
      let boundMethods = this.boundInstanceMethods();
      if (boundMethods.length > 0) {
        let isSubclass = this.getClassPatcher().isSubclass();
        if (isSubclass && !this.shouldAllowInvalidConstructors()) {
          throw this.error(getInvalidConstructorErrorMessage(
            'Cannot automatically convert a subclass that uses bound methods.'
          ));
        }

        let { source } = this.context;
        let insertionPoint = this.statements[0].outerStart;
        let methodIndent = adjustIndent(source, insertionPoint, 0);
        let methodBodyIndent = adjustIndent(source, insertionPoint, 1);
        let constructor = '';
        if (isSubclass) {
          constructor += `constructor(...args) {\n`;
          if (this.shouldEnableBabelWorkaround()) {
            for (let line of babelConstructorWorkaroundLines) {
              constructor += `${methodBodyIndent}${line}\n`;
            }
          }
        } else {
          constructor += `constructor() {\n`;
        }
        boundMethods.forEach(method => {
          constructor += `${methodBodyIndent}${getBindingCodeForMethod(method)};\n`;
        });
        if (isSubclass) {
          constructor += `${methodBodyIndent}super(...args)\n`;
        }
        constructor += `${methodIndent}}\n\n${methodIndent}`;
        this.prependLeft(insertionPoint, constructor);
      }
    }
  }

  shouldAllowInvalidConstructors(): boolean {
    return !this.options.disallowInvalidConstructors;
  }

  shouldEnableBabelWorkaround(): boolean {
    let shouldEnable = !this.options.disableBabelConstructorWorkaround;
    if (shouldEnable) {
      this.addSuggestion(REMOVE_BABEL_WORKAROUND);
    }
    return shouldEnable;
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
    return this.statements.some(
      statement => statement instanceof ConstructorPatcher
    );
  }

  boundInstanceMethods(): Array<ClassAssignOpPatcher> {
    let boundMethods = [];
    for (let statement of this.statements) {
      if (statement instanceof ClassAssignOpPatcher && statement.isBoundInstanceMethod()) {
        boundMethods.push(statement);
      }
    }
    return boundMethods;
  }
}
