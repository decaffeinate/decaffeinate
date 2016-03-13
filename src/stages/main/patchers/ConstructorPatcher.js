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
    super.patch(options);
    let boundMethods = this.parent.boundInstanceMethods();
    if (boundMethods.length > 0) {
      let statements = this.expression.body.statements;
      let indexOfSuperStatement = -1;
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
          indexOfSuperStatement = i;
          break;
        }
      }
      let bindings = boundMethods.map(method => {
        let key = this.context.source.slice(method.key.contentStart, method.key.contentEnd);
        return `this.${key} = this.${key}.bind(this)`;
      });
      this.expression.body.insertLinesAtIndex(bindings, indexOfSuperStatement + 1);
    }
  }

  /**
   * Don't put semicolons after class constructors.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }
}
