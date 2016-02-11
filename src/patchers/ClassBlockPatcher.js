import BlockPatcher from './BlockPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

export default class ClassBlockPatcher extends BlockPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, statements: Array<NodePatcher>) {
    super(node, context, editor);
    this.statements = statements;
  }

  static patcherClassForChildNode(node: Node, property: string): ?Function {
    if (property === 'statements' && node.type === 'AssignOp') {
      return ClassAssignOpPatcher;
    }
  }

  canPatchAsExpression(): boolean {
    return false;
  }
}
