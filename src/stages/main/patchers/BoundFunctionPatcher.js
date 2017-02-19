import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import isObjectInitialiserBlock from '../../../utils/isObjectInitialiserBlock';
import traverse from '../../../utils/traverse';
import type { Node } from './../../../patchers/types';
import { isFunction } from '../../../utils/types';

/**
 * Handles bound functions, i.e. "fat arrows".
 */
export default class BoundFunctionPatcher extends FunctionPatcher {
  initialize() {
    super.initialize();
    if (this.hasInlineBody()) {
      this.body.setExpression();
    }
  }

  /**
   * Use a slightly-modified version of the regular `FunctionPatcher` when
   * we can't use arrow functions.
   */
  static patcherClassOverrideForNode(node: Node): ?Class<NodePatcher> {
    let referencesArguments = false;

    traverse(node, child => {
      if (referencesArguments) {
        // We already found a reference, so skip this.
        return false;
      } else if (child.type === 'Identifier' && child.data === 'arguments') {
        referencesArguments = true;
      } else if (child !== node && isFunction(child)) {
        // Don't descend into other functions.
        return false;
      }
    });

    if (referencesArguments || (node.parentNode && node.parentNode.type === 'NewOp')) {
      return ManuallyBoundFunctionPatcher;
    } else {
      return null;
    }
  }

  // There's no difference between statement and expression arrow functions.
  patchAsStatement(options={}) {
    this.patchAsExpression(options);
  }

  patchFunctionStart() {
    let arrow = this.getArrowToken();

    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    } else if (!this.parameterListNeedsParentheses()) {
      let [ param ] = this.parameters;
      if (param.isSurroundedByParentheses()) {
        this.remove(param.outerStart, param.contentStart);
        this.remove(param.contentEnd, param.outerEnd);
      }
    }

    if (!this.willPatchBodyInline()) {
      this.insert(arrow.end, ' {');
    }
  }

  parameterListNeedsParentheses(): boolean {
    let parameters = this.parameters;

    if (parameters.length !== 1) {
      return true;
    }

    let [ param ] = parameters;
    return !(param instanceof IdentifierPatcher);
  }

  patchFunctionBody() {
    if (this.body) {
      if (!this.willPatchBodyInline()) {
        this.body.patch({ leftBrace: false });
      } else {
        if (isObjectInitialiserBlock(this.body)) {
          this.body.surroundInParens();
        }
        this.body.patch();
      }
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insert(this.innerEnd, '}');
    }
  }

  expectedArrowType(): string {
    return '=>';
  }

  willPatchBodyInline(): boolean {
    return this.body ? this.body.willPatchAsExpression() : false;
  }

  hasInlineBody(): boolean {
    return this.body ? this.body.inline() : false;
  }

  /**
   * Bound functions already start with a paren or a param identifier, and so
   * are safe to start a statement.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
