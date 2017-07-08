import NodePatcher from './../../../patchers/NodePatcher';

export default class ExpansionPatcher extends NodePatcher {
  patchAsExpression(): void {
    // Any code handling expansions should process them without calling patch.
    // If patch ends up being called, then that means that we've hit an
    // unsupported case that's trying to treat this node as a normal expression.
    throw this.error(
      'Unexpected traversal of expansion node.'
    );
  }
}
