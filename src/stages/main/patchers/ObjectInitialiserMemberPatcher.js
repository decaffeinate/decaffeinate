import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
import StringPatcher from './StringPatcher.js';
import ThisPatcher from './ThisPatcher.js';

/**
 * Handles object properties.
 */
export default class ObjectInitialiserMemberPatcher extends ObjectBodyMemberPatcher {
  patchAsProperty() {
    if (this.key.node === this.expression.node) {
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
  patchAsShorthand({ expand=false }={}) {
    let { key } = this;
    if (key instanceof MemberAccessOpPatcher) {
      key.patch();
      // e.g. `{ @name }`
      let memberAccessKey = (key: MemberAccessOpPatcher);
      if (!(memberAccessKey.expression instanceof ThisPatcher)) {
        throw this.error(
          `expected property key member access on 'this', e.g. '@name'`
        );
      }
      // `{ @name }` → `{ name: @name }`
      //                  ^^^^^^
      this.insert(
        memberAccessKey.outerStart,
        `${memberAccessKey.getMemberName()}: `
      );
    } else if (expand) {
      let isComputed = key instanceof StringPatcher && key.shouldBecomeTemplateLiteral();

      if (isComputed) {
        // `{ `a = ${1 + 1}` }` → `{ [`a = ${1 + 1}` }`
        //                           ^
        this.insert(key.outerStart, '[');
      }

      let valueCode;
      if (key.isRepeatable()) {
        valueCode = key.patchAndGetCode();
      } else {
        key.patch();
        valueCode = key.makeRepeatable();
      }

      if (isComputed) {
        this.insert(key.outerEnd, ']');
      }

      // `{ a } → { a: a }`
      //             ^^^
      this.insert(key.outerEnd, `: ${valueCode}`);
    }
  }
}
