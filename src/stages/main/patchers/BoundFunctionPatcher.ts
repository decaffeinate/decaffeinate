import { traverse } from 'decaffeinate-parser';
import { Identifier, Node } from 'decaffeinate-parser/dist/nodes';
import { PatcherClass } from '../../../patchers/NodePatcher';
import { PatchOptions } from '../../../patchers/types';
import blockStartsWithObjectInitialiser from '../../../utils/blockStartsWithObjectInitialiser';
import notNull from '../../../utils/notNull';
import { isFunction } from '../../../utils/types';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';

/**
 * Handles bound functions, i.e. "fat arrows".
 */
export default class BoundFunctionPatcher extends FunctionPatcher {
  initialize(): void {
    super.initialize();
    if (this.hasInlineBody()) {
      notNull(this.body).setExpression();
    }
  }

  /**
   * Use a slightly-modified version of the regular `FunctionPatcher` when
   * we can't use arrow functions.
   */
  static patcherClassOverrideForNode(node: Node): PatcherClass | null {
    let referencesArguments = false;

    traverse(node, child => {
      if (referencesArguments) {
        // We already found a reference, so skip this.
        return false;
      } else if (child instanceof Identifier && child.data === 'arguments') {
        referencesArguments = true;
      } else if (child !== node && isFunction(child)) {
        // Don't descend into other functions.
        return false;
      }
      return true;
    });

    if (referencesArguments) {
      return ManuallyBoundFunctionPatcher;
    } else {
      return null;
    }
  }

  // There's no difference between statement and expression arrow functions.
  patchAsStatement(options: PatchOptions = {}): void {
    this.patchAsExpression(options);
  }

  patchFunctionStart(): void {
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

  patchFunctionBody(): void {
    if (this.body) {
      if (!this.willPatchBodyInline()) {
        if (this.isEndOfFunctionCall()) {
          this.body.patch({ leftBrace: false, rightBrace: false });
          this.placeCloseBraceBeforeFunctionCallEnd();
        } else {
          this.body.patch({ leftBrace: false });
        }
      } else {
        let needsParens = blockStartsWithObjectInitialiser(this.body) &&
          !this.body.isSurroundedByParentheses();
        if (needsParens) {
          this.insert(this.body.innerStart, '(');
        }
        this.body.patch();
        if (needsParens) {
          this.insert(this.body.innerEnd, ')');
        }
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
