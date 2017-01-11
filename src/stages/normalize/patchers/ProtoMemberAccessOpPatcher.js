import { SourceType } from 'coffee-lex';
import type SourceToken from 'coffee-lex/dist/SourceToken';
import NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from '../../../patchers/types';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

export default class ProtoMemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  patchAsExpression() {
    this.expression.patch();
    // `a::b` → `a.prototype.b`
    //   ^^       ^^^^^^^^^^
    let protoToken = this.getProtoToken();
    if (this.parent instanceof MemberAccessOpPatcher) {
      this.overwrite(protoToken.start, protoToken.end, '.prototype.');
    } else {
      this.overwrite(protoToken.start, protoToken.end, '.prototype');
    }
  }

  getProtoToken(): SourceToken {
    let protoIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.expression.outerEnd,
      this.contentEnd,
      token => token.type === SourceType.PROTO
    );

    if (protoIndex) {
      let protoToken = this.sourceTokenAtIndex(protoIndex);

      if (protoToken) {
        return protoToken;
      }
    }

    throw this.error(`unable to find '::' token after proto member access`);
  }
}
