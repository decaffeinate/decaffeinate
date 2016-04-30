import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
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
    key.patch();
    if (key instanceof MemberAccessOpPatcher) {
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
      let isComputed = !key.isRepeatable();

      if (isComputed) {
        // `{ `a = ${1 + 1}` }` → `{ [`a = ${1 + 1}`] }`
        //                           ^              ^
        this.insert(key.outerStart, '[');
        this.insert(key.outerEnd, ']');
      }

      let keyAgain = key.makeRepeatable();

      // `{ a } → { a: a }`
      //             ^^^
      this.insert(key.outerEnd, `: ${keyAgain}`);
    }
  }
}
