import check from './support/check';

describe('of operator', () => {
  it('turns into an `in` operator', () => {
    check(`
      a of b
    `, `
      a in b;
    `);
  });

  it('works in an expression context', () => {
    check(`
      a(b, c.d of e)
    `, `
      a(b, c.d in e);
    `);
  });

  it('works with negated `of`', () => {
    check(`
      a not of b
    `, `
      !(a in b);
    `);
  });

  it('can be double negated', () => {
    check(`
      unless a not of b
        c
    `, `
      if (a in b) {
        c;
      }
    `);
  });
});
