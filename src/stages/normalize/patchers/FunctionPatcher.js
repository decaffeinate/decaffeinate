import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: ?NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, parameters: Array<NodePatcher>, body: ?NodePatcher) {
    super(node, context, editor);
    this.parameters = parameters;
    this.body = body;
  }

  patchAsExpression() {
    // To avoid knowledge of all the details how assignments can be nested in nodes,
    // we add a callback to the function node before patching the parameters and remove it afterwards.
    // This is detected and used by the MemberAccessOpPatcher to claim a free binding for this parameter
    // (from the functions scope, not the body's scope)

    let assignments = [];
    this.node._assignMember = function(memberName: string){
      let varName = this.claimFreeBinding(memberName);
      assignments.push(`@${memberName} = ${varName}`);
      this.log(`Replacing parameter @${memberName} with ${varName}`);
      return varName;
    }.bind(this);

    this.parameters.forEach(parameter => parameter.patch());

    delete this.node._assignMember;

    // If there were assignments from parameters insert them
    if (this.body) {
      // before the actual body
      if (assignments.length) {
        let indent = this.body.getIndent(0);
        let text = assignments.join(`\n${indent}`);
        this.insert(this.body.contentStart, `${text}\n${indent}`);
      }
      this.body.patch();
    } else if (assignments.length) {
      // as the body if there is no body
      // Add a return statement for non-constructor methods without body to avoid bad implict return
      if (this.node.parentNode.type != 'Constructor') {
        assignments.push('return');
      }
      let indent = this.getIndent(1);
      let text = assignments.join(`\n${indent}`);
      this.insert(this.contentEnd, `\n${indent}${text}`);
    }
  }
}
