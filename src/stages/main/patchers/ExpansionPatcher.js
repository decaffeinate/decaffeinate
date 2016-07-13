import NodePatcher from './../../../patchers/NodePatcher.js';

export default class ExpansionPatcher extends NodePatcher {
  patchAsExpression() {
    // Any code handling expansions should process them without calling patch.
    // If patch ends up being called, then that means that we've hit an
    // unsupported case that's trying to treat this node as a normal expression.
    throw this.error(
      'expansions (e.g. `[a, ..., b] = c`) are not supported yet in all ' +
      'cases, see https://github.com/decaffeinate/decaffeinate/issues/268'
    );
  }
}
