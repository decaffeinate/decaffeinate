import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles object properties.
 */
export default class ObjectBodyMemberPatcher extends NodePatcher {
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
  patch(options={}) {
    if (this.isMethod()) {
      this.patchAsMethod(options);
    } else {
      this.patchAsProperty(options);
    }
  }

  /**
   * @protected
   */
  patchAsMethod() {
    let computedKey = this.isComputed();
    if (computedKey) {
      // `{ 'hi there': ->` → `{ ['hi there': ->`
      //                         ^
      this.insert(this.key.before, '[');
    }
    this.patchKey();
    if (computedKey) {
      // `{ ['hi there': ->` → `{ ['hi there']: ->`
      //                                     ^
      this.insert(this.key.after, ']');
    }
    // `{ ['hi there']: ->` → `{ ['hi there']->`
    //                ^^
    this.remove(this.key.after, this.expression.before);
    this.patchExpression();
  }

  /**
   * @protected
   */
  patchAsProperty() {
    this.patchKey();
    this.patchExpression();
  }

  /**
   * @protected
   */
  patchKey() {
    this.key.patch();
  }

  /**
   * @protected
   */
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
}
