import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
import ThisPatcher from './ThisPatcher.js';

/**
 * Handles object properties.
 */
export default class ObjectInitialiserMemberPatcher extends ObjectBodyMemberPatcher {
  /**
   * @protected
   */
  patchAsProperty() {
    if (this.key.node === this.expression.node) {
      this.patchAsShorthand();
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
        memberAccessKey.before,
        `${memberAccessKey.getMemberName()}: `
      );
    } else if (expand) {
      // `{ a } → { a: a }`
      //            ^^^
      this.insert(key.before, `${this.slice(key.start, key.end)}: `);
    }
    key.patch();
  }
}
