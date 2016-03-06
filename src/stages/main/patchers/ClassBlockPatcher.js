import BlockPatcher from './BlockPatcher.js';
import ClassAssignOpPatcher from './ClassAssignOpPatcher.js';
import ConstructorPatcher from './ConstructorPatcher.js';
import NodePatcher from './NodePatcher.js';
import adjustIndent from '../../../utils/adjustIndent.js';
import type { Node, ParseContext, Editor } from './types.js';

export default class ClassBlockPatcher extends BlockPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, statements: Array<NodePatcher>) {
    super(node, context, editor);
    this.statements = statements;
  }

  static patcherClassForChildNode(node: Node, property: string): ?Class<NodePatcher> {
    if (property === 'statements' && node.type === 'AssignOp') {
      return ClassAssignOpPatcher;
    }
  }

  patch(options={}) {
    if (!this.hasConstructor()) {
      let boundMethods = this.boundInstanceMethods();
      if (boundMethods.length > 0) {
        let { source } = this.context;
        let insertionPoint = this.statements[0].before;
        let methodIndent = adjustIndent(source, insertionPoint, 0);
        let methodBodyIndent = adjustIndent(source, insertionPoint, 1);
        let constructor = '';
        if (this.parent.isSubclass()) {
          constructor += `constructor(...args) {\n${methodBodyIndent}super(...args);\n`;
        } else {
          constructor += `constructor() {\n`;
        }
        boundMethods.forEach(method => {
          let key = source.slice(method.key.start, method.key.end);
          constructor += `${methodBodyIndent}this.${key} = this.${key}.bind(this);\n`;
        });
        constructor += `${methodIndent}}\n\n${methodIndent}`;
        this.insert(insertionPoint, constructor);
      }
    }
    super.patch(options);
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
