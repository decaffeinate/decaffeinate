import { AVOID_TOP_LEVEL_THIS } from '../../../suggestions';
import NodePatcher from './../../../patchers/NodePatcher';

export default class ThisPatcher extends NodePatcher {
  patchAsExpression(): void {
    this.reportTopLevelThisIfNecessary();
    if (this.isShorthandThis()) {
      this.overwrite(this.contentStart, this.contentEnd, 'this');
    }
  }

  isShorthandThis(): boolean {
    return this.getOriginalSource() === '@';
  }

  isRepeatable(): boolean {
    return true;
  }

  reportTopLevelThisIfNecessary(): void {
    let scope = this.getScope();
    while (
      scope.parent &&
      ['Program', 'Function', 'GeneratorFunction', 'Class'].indexOf(scope.containerNode.type) === -1
    ) {
      scope = scope.parent;
    }
    if (scope.containerNode.type === 'Program') {
      this.addSuggestion(AVOID_TOP_LEVEL_THIS);
    }
  }
}
