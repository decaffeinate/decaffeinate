import NodePatcher from './NodePatcher.js';
import ClassAssignOpPatcher from './ClassAssignOpPatcher.js';
import ConstructorPatcher from './ConstructorPatcher.js';

export default class SuperPatcher extends NodePatcher {
  patchAsExpression() {
    let name = this.getContainingMethodName();
    if (name) {
      this.insertAtEnd(`.${name}`);
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
