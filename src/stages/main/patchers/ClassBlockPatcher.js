import BlockPatcher from './BlockPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import ConstructorPatcher from './ConstructorPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import adjustIndent from '../../../utils/adjustIndent';
import babelConstructorWorkaroundLines from '../../../utils/babelConstructorWorkaroundLines';
import getBindingCodeForMethod from '../../../utils/getBindingCodeForMethod';
import getInvalidConstructorErrorMessage from '../../../utils/getInvalidConstructorErrorMessage';
import type ClassPatcher from './ClassPatcher';
import type { Node } from './../../../patchers/types';

export default class ClassBlockPatcher extends BlockPatcher {
  static patcherClassForChildNode(node: Node, property: string): ?Class<NodePatcher> {
    if (property === 'statements' && node.type === 'AssignOp') {
      return ClassAssignOpPatcher;
    }
  }

  patch(options={}) {
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

  shouldAllowInvalidConstructors() {
    return this.options.allowInvalidConstructors || this.options.enableBabelConstructorWorkaround;
  }

  shouldEnableBabelWorkaround() {
    return this.options.enableBabelConstructorWorkaround;
  }
  
  getClassPatcher(): ClassPatcher {
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
    return this.statements.filter(statement => {
      if (statement instanceof ClassAssignOpPatcher) {
        return statement.isBoundInstanceMethod();
      } else {
        return false;
      }
    });
  }
}
