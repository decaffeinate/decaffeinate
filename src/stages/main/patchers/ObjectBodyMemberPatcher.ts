import {ObjectInitialiserMember} from 'decaffeinate-parser/dist/nodes';
import { PatcherContext } from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';
import AsyncFunctionPatcher from './AsyncFunctionPatcher';
import BoundAsyncFunctionPatcher from './BoundAsyncFunctionPatcher';
import BoundFunctionPatcher from './BoundFunctionPatcher';
import BoundGeneratorFunctionPatcher from './BoundGeneratorFunctionPatcher';
import FunctionPatcher from './FunctionPatcher';
import GeneratorFunctionPatcher from './GeneratorFunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';
import StringPatcher from './StringPatcher';

/**
 * Handles object properties.
 */
export default abstract class ObjectBodyMemberPatcher extends NodePatcher {
  key: NodePatcher;
  // Expression is null for shorthand object initializers.
  expression: NodePatcher | null;

  constructor(patcherContext: PatcherContext, key: NodePatcher, expression: NodePatcher) {
    super(patcherContext);
    this.key = key;
    this.expression = expression;
  }

  initialize(): void {
    this.key.setRequiresExpression();
    if (this.expression) {
      this.expression.setRequiresExpression();
    }
  }

  /**
   * KEY : EXPRESSION
   */
  patchAsExpression(): void {
    if (this.isMethod()) {
      this.patchAsMethod();
    } else {
      this.patchAsProperty();
    }
  }

  patchAsMethod(): void {
    if (!this.expression) {
      throw this.error('Expected expression to be non-null in method case.');
    }
    if (this.isAsyncMethod()) {
      this.insert(this.key.outerStart, 'async ');
    }
    if (this.isGeneratorMethod()) {
      this.insert(this.key.outerStart, '*');
    }
    this.patchKey();
    // `{ ['hi there']: ->` → `{ ['hi there']->`
    //                ^^
    this.remove(this.key.outerEnd, this.expression.outerStart);
    // The function expression might be surrounded by parens, so remove them if
    // necessary.
    this.remove(this.expression.outerStart, this.expression.contentStart);
    this.remove(this.expression.contentEnd, this.expression.outerEnd);
    this.patchExpression();
  }

  patchAsProperty(): void {
    this.patchKey();
    this.patchExpression();
  }

  patchKey(): void {
    if (this.node instanceof ObjectInitialiserMember && this.node.isComputed) {
      // Explicit CS2 computed keys are already in the right syntax and just need to be patched.
      this.key.patch();
      return;
    }
    let computedKeyPatcher = this.getComputedKeyPatcher();
    if (computedKeyPatcher !== null) {
      // Since we're replacing an expression like `"#{foo}"` with just `foo`,
      // the outer string expression might be marked as repeatable, in which case
      // we should delegate that to the inner expression.
      let repeatOptions = this.key.getRepeatableOptions();
      if (repeatOptions) {
        computedKeyPatcher.setRequiresRepeatableExpression(repeatOptions);
      }
      this.overwrite(this.key.outerStart, computedKeyPatcher.outerStart, '[');
      computedKeyPatcher.patch();
      this.overwrite(computedKeyPatcher.outerEnd, this.key.outerEnd, ']');
      if (repeatOptions) {
        this.key.overrideRepeatCode(computedKeyPatcher.getRepeatCode());
      }
    } else {
      let needsBrackets =
        !(this.key instanceof StringPatcher && !this.key.shouldBecomeTemplateLiteral()) &&
        !(this.key instanceof IdentifierPatcher) &&
        (this.key.node.type !== 'Int' && this.key.node.type !== 'Float');
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
  getComputedKeyPatcher(): NodePatcher | null {
    if (this.key instanceof StringPatcher &&
        this.key.quasis.length === 2 &&
        this.key.expressions.length === 1 &&
        this.key.quasis[0].node.data === '' &&
        this.key.quasis[1].node.data === '') {
      return this.key.expressions[0];
    }
    return null;
  }

  patchExpression(): void {
    if (this.expression) {
      this.expression.patch({ method: this.isMethod() });
    }
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

  isAsyncMethod(): boolean {
    return this.expression instanceof AsyncFunctionPatcher ||
      this.expression instanceof BoundAsyncFunctionPatcher;
  }
}
