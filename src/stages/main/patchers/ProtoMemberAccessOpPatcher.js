import MemberAccessOpPatcher from './MemberAccessOpPatcher';

export default class ProtoMemberAccessOpPatcher extends MemberAccessOpPatcher {
  patchAsExpression() {
    this.expression.patch();
    // `a::b` → `a.prototype.b`
    //   ^^        ^^^^^^^^^^
    let memberNameToken = this.getMemberNameSourceToken();
    this.overwrite(this.expression.outerEnd, memberNameToken.start, '.prototype.');
  }

  hasImplicitOperator(): boolean {
    return false;
  }

  getFullMemberName(): string {
    return `prototype.${this.getMemberName()}`;
  }
}
