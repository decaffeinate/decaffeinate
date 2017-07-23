import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import StringPatcher from './StringPatcher';
import ThisPatcher from './ThisPatcher';

/**
 * Handles object properties.
 */
export default class ObjectInitialiserMemberPatcher extends ObjectBodyMemberPatcher {
  setAssignee(): void {
    if (this.expression === null) {
      this.key.setAssignee();
    } else {
      this.expression.setAssignee();
    }
    super.setAssignee();
  }

  patchAsProperty(): void {
    if (this.expression === null) {
      this.patchAsShorthand({
        expand: this.key.node.type !== 'Identifier'
      });
    } else {
      super.patchAsProperty();
    }
  }

  /**
   * @private
   */
  patchAsShorthand({expand=false}: {expand: boolean}): void {
    let { key } = this;
    if (key instanceof MemberAccessOpPatcher) {
      key.patch();
      // e.g. `{ @name }`
      if (!(key.expression instanceof ThisPatcher)) {
        throw this.error(
          `expected property key member access on 'this', e.g. '@name'`
        );
      }
      // `{ @name }` → `{ name: @name }`
      //                  ^^^^^^
      this.insert(
        key.outerStart,
        `${key.getMemberName()}: `
      );
    } else if (expand) {
      let isComputed = key instanceof StringPatcher && key.shouldBecomeTemplateLiteral();

      if (isComputed) {
        // `{ `a = ${1 + 1}` }` → `{ [`a = ${1 + 1}` }`
        //                           ^
        this.insert(key.outerStart, '[');
      }

      let valueCode = key.patchRepeatable();

      if (isComputed) {
        this.insert(key.outerEnd, ']');
      }

      // `{ a } → { a: a }`
      //             ^^^
      this.insert(key.outerEnd, `: ${valueCode}`);
    }
  }
}
