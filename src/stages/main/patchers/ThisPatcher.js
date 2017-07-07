import NodePatcher from './../../../patchers/NodePatcher';
import { AVOID_TOP_LEVEL_THIS } from '../../../suggestions';

export default class ThisPatcher extends NodePatcher {
  patchAsExpression() {
    this.reportTopLevelThisIfNecessary();
    if (this.isShorthandThis()) {
      this.overwrite(this.contentStart, this.contentEnd, 'this');
    }
  }

  isShorthandThis() {
    return this.getOriginalSource() === '@';
  }

  isRepeatable(): boolean {
    return true;
  }

  reportTopLevelThisIfNecessary() {
    let scope = this.getScope();
    while (scope.parent &&
        [
          'Program', 'Function', 'GeneratorFunction', 'Class'
        ].indexOf(scope.containerNode.type) === -1) {
      scope = scope.parent;
    }
    if (scope.containerNode.type === 'Program') {
      this.addSuggestion(AVOID_TOP_LEVEL_THIS);
    }
  }
}
