import SourceType from 'coffee-lex/dist/SourceType';
import { Identifier, ObjectInitialiserMember } from 'decaffeinate-parser/dist/nodes';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import StringPatcher from './StringPatcher';
import ThisPatcher from './ThisPatcher';

/**
 * Handles object properties.
 */
export default class ObjectInitialiserMemberPatcher extends ObjectBodyMemberPatcher {
  node!: ObjectInitialiserMember;

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
      const shouldExpand = !(this.key.node instanceof Identifier) || this.node.isComputed;
      this.patchAsShorthand({
        expand: shouldExpand,
      });
    } else {
      super.patchAsProperty();
    }
  }

  /**
   * @private
   */
  patchAsShorthand({ expand = false }: { expand: boolean }): void {
    const { key } = this;
    if (key instanceof MemberAccessOpPatcher) {
      key.patch();
      // e.g. `{ @name }`
      if (!(key.expression instanceof ThisPatcher)) {
        throw this.error(`expected property key member access on 'this', e.g. '@name'`);
      }
      // `{ @name }` → `{ name: @name }`
      //                  ^^^^^^
      this.insert(key.outerStart, `${key.getMemberName()}: `);
    } else if (expand) {
      const needsBrackets = key instanceof StringPatcher && key.shouldBecomeTemplateLiteral();

      if (needsBrackets) {
        // `{ `a = ${1 + 1}` }` → `{ [`a = ${1 + 1}` }`
        //                           ^
        this.insert(key.outerStart, '[');
      }

      const valueCode = key.patchRepeatable();

      if (needsBrackets) {
        this.insert(key.outerEnd, ']');
      }

      let keyEnd;
      if (this.node.isComputed) {
        const closeBracketToken = key.outerEndTokenIndex.next();
        const tokenAfterLast = closeBracketToken ? this.sourceTokenAtIndex(closeBracketToken) : null;
        if (!tokenAfterLast || tokenAfterLast.type !== SourceType.RBRACKET) {
          throw this.error('Expected close-bracket after computed property.');
        }
        keyEnd = tokenAfterLast.end;
      } else {
        keyEnd = key.outerEnd;
      }

      // `{ a } → { a: a }`
      //             ^^^
      this.insert(keyEnd, `: ${valueCode}`);
    }
  }
}
