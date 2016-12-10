import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
import traverse from '../../../utils/traverse.js';
import type FunctionPatcher from './FunctionPatcher.js';
import type NodePatcher from '../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';

export default class ConstructorPatcher extends ObjectBodyMemberPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, assignee: NodePatcher, expression: FunctionPatcher) {
    super(node, context, editor, assignee, expression);

    // Constructor methods do not have implicit returns.
    expression.disableImplicitReturns();
  }

  patch(options={}) {
    let boundMethods = this.parent.boundInstanceMethods();
    let bindings = boundMethods.map(method => {
      let key = this.context.source.slice(method.key.contentStart, method.key.contentEnd);
      return `this.${key} = this.${key}.bind(this)`;
    });

    if (bindings.length > 0 && this.expression.body) {
      let indexOfSuperStatement = this.getIndexOfSuperStatement(this.expression.body.statements);
      // Work around some magic-string issues by carefully deciding patching
      // order. If we're adding statements to the start, patch the function
      // first so the statements are patched after the initial function code. If
      // we're adding statements to the end, patch the function last so we don't
      // end up adding statements after the close-brace.
      if (indexOfSuperStatement < 0) {
        super.patch(options);
        this.expression.body.insertStatementsAtIndex(bindings, 0);
      } else {
        this.expression.body.insertStatementsAtIndex(bindings, indexOfSuperStatement + 1);
        super.patch(options);
      }
    } else if (bindings.length > 0) {
      super.patch();
      // As a special case, if there's no function body but we still want to
      // generate bindings, overwrite the function body with the desired
      // contents, since it's sort of hard to insert contents in the middle of
      // the generated {}.
      let indent = this.getIndent();
      let bodyIndent = this.getIndent(1);
      let arrowToken = this.expression.getArrowToken();

      let bindingLines = bindings.map(binding => `${bodyIndent}${binding}\n`);
      let bodyCode = `{\n${bindingLines.join('')}${indent}}`;
      this.overwrite(arrowToken.start, this.expression.outerEnd, bodyCode);
    } else {
      super.patch(options);
    }
  }

  getIndexOfSuperStatement(statements) {
    for (let i = 0; i < statements.length; i++) {
      let callsSuper = false;
      traverse(statements[i].node, child => {
        if (callsSuper) {
          // Already found it, skip this one.
          return false;
        } else if (child.type === 'Super') {
          // Found it.
          callsSuper = true;
        } else if (child.type === 'Class') {
          // Don't go into other classes.
          return false;
        }
      });
      if (callsSuper) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Don't put semicolons after class constructors.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }
}
