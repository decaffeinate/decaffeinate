import check from './support/check';

describe('changing prototype member access into normal member access', () => {
  it('replaces prototype member access', () => {
    check(`A::b`, `A.prototype.b;`);
  });

  it('works in combination with the shorthand this patcher', () => {
    check(`@::b`, `this.prototype.b;`);
  });
});
