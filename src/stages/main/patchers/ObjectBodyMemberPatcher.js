import BoundFunctionPatcher from './BoundFunctionPatcher.js';
import FunctionPatcher from './FunctionPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';

/**
 * Handles object properties.
 */
export default class ObjectBodyMemberPatcher extends NodePatcher {
  key: NodePatcher;
  expression: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, key: NodePatcher, expression: NodePatcher) {
    super(node, context, editor);
    this.key = key;
    this.expression = expression;
  }

  initialize() {
    this.key.setRequiresExpression();
    this.expression.setRequiresExpression();
  }

  /**
   * KEY : EXPRESSION
   */
  patchAsExpression(options={}) {
    if (this.isMethod()) {
      this.patchAsMethod(options);
    } else {
      this.patchAsProperty(options);
    }
  }

  patchAsMethod() {
    let computedKey = this.isComputed();
    if (computedKey) {
      // `{ 'hi there': ->` → `{ ['hi there': ->`
      //                         ^
      this.insert(this.key.outerStart, '[');
    }
    this.patchKey();
    if (computedKey) {
      // `{ ['hi there': ->` → `{ ['hi there']: ->`
      //                                     ^
      this.insert(this.key.outerEnd, ']');
    }
    if (!this.isBoundMethod()) {
      // `{ ['hi there']: ->` → `{ ['hi there']->`
      //                ^^
      this.remove(this.key.outerEnd, this.expression.outerStart);
    }
    this.patchExpression();
  }

  patchAsProperty() {
    this.patchKey();
    this.patchExpression();
  }

  patchKey() {
    this.key.patch();
  }

  patchExpression() {
    this.expression.patch({ method: this.isMethod() });
  }

  /**
   * @protected
   */
  isComputed(): boolean {
    return !(this.key instanceof IdentifierPatcher);
  }

  /**
   * @protected
   */
  isMethod(): boolean {
    return this.expression instanceof FunctionPatcher;
  }

  /**
   * @protected
   */
  isBoundMethod(): boolean {
    return this.expression instanceof BoundFunctionPatcher;
  }
}
