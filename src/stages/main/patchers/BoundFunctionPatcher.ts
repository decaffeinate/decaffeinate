import { AssignOp, Node } from 'decaffeinate-parser/dist/nodes';
import { PatcherClass } from '../../../patchers/NodePatcher';
import { PatchOptions } from '../../../patchers/types';
import blockStartsWithObjectInitialiser from '../../../utils/blockStartsWithObjectInitialiser';
import containsDescendant from '../../../utils/containsDescendant';
import notNull from '../../../utils/notNull';
import referencesArguments from '../../../utils/referencesArguments';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import ManuallyBoundFunctionPatcher from './ManuallyBoundFunctionPatcher';

/**
 * Handles bound functions, i.e. "fat arrows".
 */
export default class BoundFunctionPatcher extends FunctionPatcher {
  initialize(): void {
    super.initialize();
    if (this.shouldPatchAsBlocklessArrowFunction()) {
      notNull(this.body).setExpression();
    }
  }

  /**
   * Use a slightly-modified version of the regular `FunctionPatcher` when
   * we can't use arrow functions.
   */
  static patcherClassOverrideForNode(node: Node): PatcherClass | null {
    if (referencesArguments(node)) {
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
    return this.body !== null && this.body.willPatchAsExpression();
  }

  shouldPatchAsBlocklessArrowFunction(): boolean {
    if (!this.body) {
      return false;
    }
    if (containsDescendant(this.node, child => child instanceof AssignOp)) {
      return false;
    }
    return this.body.inline();
  }

  /**
   * Bound functions already start with a paren or a param identifier, and so
   * are safe to start a statement.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
