import BoundFunctionPatcher from './BoundFunctionPatcher.js';
import BoundGeneratorFunctionPatcher from './BoundGeneratorFunctionPatcher.js';
import FunctionPatcher from './FunctionPatcher.js';
import GeneratorFunctionPatcher from './GeneratorFunctionPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher.js';
import StringPatcher from './StringPatcher.js';
import NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

/**
 * Handles object properties.
 */
export default class ObjectBodyMemberPatcher extends NodePatcher {
  key: NodePatcher;
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, key: NodePatcher, expression: NodePatcher) {
    super(patcherContext);
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
    // `{ ['hi there']: ->` → `{ ['hi there']->`
    //                ^^
    this.remove(this.key.outerEnd, this.expression.outerStart);
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
      let needsBrackets =
        !(this.key instanceof StringPatcher && !this.key.shouldBecomeTemplateLiteral()) &&
        !(this.key instanceof IdentifierPatcher);
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
    if (this.key instanceof StringPatcher &&
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
   * In normal object bodies, we can use method syntax for normal arrow
   * functions and for normal generator functions. If we need to explicitly add
   * `.bind(this)`, then we won't be able to use the method form. But for
   * classes, since the binding is done in the constructor, we can still use
   * method syntax, so ClassAssignOpPatcher overrides this method for that case.
   * We also allow ClassBoundMethodFunctionPatcher since that only comes up in
   * the class case.
   *
   * @protected
   */
  isMethod(): boolean {
    return this.expression instanceof FunctionPatcher &&
        !(this.expression instanceof ManuallyBoundFunctionPatcher) &&
        !(this.expression instanceof BoundFunctionPatcher);
  }

  /**
   * Note that we include BoundGeneratorFunctionPatcher, even though the object
   * case doesn't treat it as a method, since the class case should use a
   * generator method.
   *
   * @protected
   */
  isGeneratorMethod(): boolean {
    return this.expression instanceof GeneratorFunctionPatcher ||
      this.expression instanceof BoundGeneratorFunctionPatcher;
  }
}
