import NodePatcher from '../../../patchers/NodePatcher';
import {PatcherContext} from '../../../patchers/types';
import AssignOpPatcher from './AssignOpPatcher';

export default class ExportNamedDeclarationPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  patchAsStatement(): void {
    // export a = 1 → export var a = 1
    //                      ^^^^
    if (this.expression instanceof AssignOpPatcher) {
      // The assign op has bad location data (starts at the start of the export), so instead use
      // tokens to determine the insert position.
      let exportToken = this.firstToken();
      this.insert(exportToken.end, ' var');
    }
    this.expression.patch();
  }
}
