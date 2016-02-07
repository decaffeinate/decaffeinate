import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import NodePatcher from './NodePatcher';
import ThisPatcher from './ThisPatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles object properties.
 */
export default class ObjectInitialiserMemberPatcher extends NodePatcher {
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
  patch() {
    if (this.expression instanceof FunctionPatcher) {
      this.patchAsMethod();
    } else if (this.key.node === this.expression.node) {
      this.patchAsShorthand();
    } else {
      this.patchAsProperty();
    }
  }

  /**
   * @private
   */
  patchAsMethod() {
    let computedKey = !(this.key instanceof IdentifierPatcher);
    if (computedKey) {
      // `{ 'hi there': ->` → `{ ['hi there': ->`
      //                         ^
      this.insert(this.key.before, '[');
    }
    this.key.patch();
    if (computedKey) {
      // `{ ['hi there': ->` → `{ ['hi there']: ->`
      //                                     ^
      this.insert(this.key.after, ']');
    }
    // `{ ['hi there']: ->` → `{ ['hi there']->`
    //                ^^
    this.remove(this.key.after, this.expression.before);
    this.expression.patch({ method: true });
  }

  /**
   * @private
   */
  patchAsShorthand({ expand=false }={}) {
    let { key } = this;
    if (key instanceof MemberAccessOpPatcher) {
      // e.g. `{ @name }`
      let memberAccessKey = (key: MemberAccessOpPatcher);
      if (!(memberAccessKey.expression instanceof ThisPatcher)) {
        throw this.error(
          `expected property key member access on 'this', e.g. '@name'`
        );
      }
      // `{ @name }` → `{ name: @name }`
      //                  ^^^^^^
      this.insert(
        memberAccessKey.before,
        `${memberAccessKey.getMemberName()}: `
      );
    } else if (expand) {
      // `{ a } → { a: a }`
      //            ^^^
      this.insert(key.before, `${this.slice(key.start, key.end)}: `);
    }
    key.patch();
  }

  /**
   * @private
   */
  patchAsProperty() {
    this.key.patch();
    this.expression.patch();
  }
}
