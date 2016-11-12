import BoundFunctionPatcher from './BoundFunctionPatcher.js';
import FunctionPatcher from './FunctionPatcher.js';
import GeneratorFunctionPatcher from './GeneratorFunctionPatcher.js';
import HerestringPatcher from './HerestringPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import StringPatcher from './StringPatcher.js';
import TemplateLiteralPatcher from './TemplateLiteralPatcher.js';
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
    if (this.isGeneratorMethod()) {
      this.insert(this.key.outerStart, '*');
    }
    let isComputed = this.isMethodNameComputed();
    if (isComputed) {
      // `{ 'hi there': ->` → `{ ['hi there': ->`
      //                         ^
      this.insert(this.key.outerStart, '[');
    }
    this.patchKey();
    if (isComputed) {
      // `{ ['hi there': ->` → `{ ['hi there']: ->`
      //                                     ^
      this.insert(this.key.outerEnd, ']');
    }
    if (!this.isBoundMethod()) {
      // `{ ['hi there']: ->` → `{ ['hi there']->`
      //                ^^
      this.remove(this.key.outerEnd, this.expression.outerStart);
    }
    // The function expression might be surrounded by parens, so remove them if
    // necessary.
    this.remove(this.expression.outerStart, this.expression.contentStart);
    this.remove(this.expression.contentEnd, this.expression.outerEnd);
    this.patchExpression();
  }

  patchAsProperty() {
    this.patchKey();
    this.patchExpression();
  }

  patchKey() {
    let computedKeyPatcher = this.getComputedKeyPatcher();
    if (computedKeyPatcher !== null) {
      this.overwrite(this.key.outerStart, computedKeyPatcher.outerStart, '[');
      computedKeyPatcher.patch();
      this.overwrite(computedKeyPatcher.outerEnd, this.key.outerEnd, ']');
    } else {
      let needsBrackets = !(this.key instanceof StringPatcher) &&
        !(this.key instanceof IdentifierPatcher) &&
        !(this.key instanceof HerestringPatcher && !this.key.stringContainsNewline());
      if (needsBrackets) {
        this.insert(this.key.outerStart, '[');
      }
      this.key.patch();
      if (needsBrackets) {
        this.insert(this.key.outerEnd, ']');
      }
    }
  }

  /**
   * As a special case, transform {"#{a.b}": c} to {[a.b]: c}, since a template
   * literal is the best way to do computed keys in CoffeeScript. This method
   * gets the patcher for that computed key node, if any.
   */
  getComputedKeyPatcher() {
    if (this.key instanceof TemplateLiteralPatcher &&
        this.key.quasis.length === 2 &&
        this.key.expressions.length === 1 &&
        this.key.quasis[0].node.data === '' &&
        this.key.quasis[1].node.data === '') {
      return this.key.expressions[0];
    }
    return null;
  }

  patchExpression() {
    this.expression.patch({ method: this.isMethod() });
  }

  /**
   * @protected
   */
  isMethodNameComputed(): boolean {
    return !(this.key instanceof IdentifierPatcher);
  }

  /**
   * @protected
   */
  isMethod(): boolean {
    return this.expression instanceof FunctionPatcher || this.isGeneratorMethod();
  }

  /**
   * @protected
   */
  isGeneratorMethod(): boolean {
    return this.expression instanceof GeneratorFunctionPatcher;
  }

  /**
   * @protected
   */
  isBoundMethod(): boolean {
    return this.expression instanceof BoundFunctionPatcher;
  }
}
