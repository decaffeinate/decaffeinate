import NodePatcher from './../../../patchers/NodePatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import ConstructorPatcher from './ConstructorPatcher';

export default class SuperPatcher extends NodePatcher {
  patchAsExpression() {
    let name = this.getContainingMethodName();
    if (name) {
      this.insert(this.contentEnd, `.${name}`);
    }
  }

  /**
   * @private
   */
  getContainingMethodName(): ?string {
    let { parent } = this;
    while (parent) {
      if (parent instanceof ConstructorPatcher) {
        return null;
      } else if (parent instanceof ClassAssignOpPatcher) {
        if (parent.isStaticMethod()) {
          return parent.key.node.memberName;
        } else {
          return parent.key.node.data;
        }
      }
      parent = parent.parent;
    }
    throw this.error(`no containing method found for 'super'`);
  }
}
