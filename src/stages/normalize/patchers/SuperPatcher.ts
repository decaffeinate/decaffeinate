import { SourceType, SourceToken } from 'coffee-lex';

import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import AssignOpPatcher, { EarlySuperTransformInfo } from './AssignOpPatcher';
import ClassPatcher from './ClassPatcher';

export default class SuperPatcher extends NodePatcher {
  patchAsExpression(): void {
    const earlyTransformInfo = this.getEarlyTransformInfo();
    if (earlyTransformInfo) {
      this.patchEarlySuperTransform(earlyTransformInfo);
    } else if (this.node.type === 'BareSuperFunctionApplication') {
      this.insert(this.contentEnd, '(arguments...)');
    }
  }

  /**
   * When dynamically defining a static method on a class, we need to handle any
   * super calls in the normalize stage. Otherwise, the code will move into an
   * initClass method and super calls will refer to super.initClass.
   */
  patchEarlySuperTransform({ classCode, accessCode }: EarlySuperTransformInfo): void {
    // Note that this code snippet works for static methods but not instance
    // methods. Expanded super calls for instance methods are handled in the
    // main stage.
    const replacement = `${classCode}.__proto__${accessCode}.call(this, `;
    if (this.node.type === 'BareSuperFunctionApplication') {
      this.overwrite(this.contentStart, this.contentEnd, `${replacement}arguments...)`);
    } else {
      const followingOpenParen = this.getFollowingOpenParenToken();
      this.overwrite(this.contentStart, followingOpenParen.end, replacement);
    }
  }

  getEarlyTransformInfo(): EarlySuperTransformInfo | null {
    let parent = this.parent;
    while (parent) {
      if (parent instanceof AssignOpPatcher) {
        const earlyTransformInfo = parent.getEarlySuperTransformInfo();
        if (earlyTransformInfo) {
          return earlyTransformInfo;
        }
      } else if (parent instanceof ClassPatcher) {
        return null;
      }
      parent = parent.parent;
    }
    return null;
  }

  getFollowingOpenParenToken(): SourceToken {
    const openParenTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
      this.contentEndTokenIndex,
      SourceType.CALL_START,
    );
    if (!openParenTokenIndex) {
      throw this.error('Expected open-paren after super.');
    }
    return notNull(this.sourceTokenAtIndex(openParenTokenIndex));
  }
}
