import check from './support/check';

describe('changing prototype member access into normal member access', () => {
  it('replaces prototype member access', () => {
    check(`A::b`, `A.prototype.b;`);
  });

  it('works in combination with the shorthand this patcher', () => {
    check(`@::b`, `this.prototype.b;`);
  });

  it('works with parentheses correctly', () => {
    check(`(a b)::c`, `(a(b)).prototype.c;`);
  });

  it('allows getting the whole prototype object', () => {
    check(`a::`, `a.prototype;`);
  });

  it('allows getting a repeatable version of the prototype object', () => {
    check(`
      a():: ?= b
    `, `
      let base;
      if ((base = a()).prototype == null) { base.prototype = b; }
    `);
  });

  it('is able to be made repeatable', () => {
    check(`
      a()::b ?= c
    `, `
      let base;
      if ((base = a()).prototype.b == null) { base.prototype.b = c; }
    `);
  });
});
