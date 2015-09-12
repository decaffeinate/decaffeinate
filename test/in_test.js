import check from './support/check';

describe('in operator', () => {
  it('turns into an `indexOf` call', () => {
    check(`
      a in b
    `, `
      b.indexOf(a) >= 0;
    `);
  });

  it('puts the left part first if it is potentially side-effecty', () => {
    check(`
      a.b in c
    `, `
      var ref;
      ref = a.b, c.indexOf(ref) >= 0;
    `);
  });

  it('wraps element in parentheses if needed in a function argument', () => {
    check(`
      a(b, c.d in e)
    `, `
      var ref;
      a(b, (ref = c.d, e.indexOf(ref) >= 0));
    `);
  });

  it('wraps list in parentheses if needed', () => {
    check(`
      a in b + c
    `, `
      (b + c).indexOf(a) >= 0;
    `);
  });

  it('works with a crazy case in an `if` statement', () => {
    check(`
      if a + b in c + d
        e
    `, `
      var ref;
      if (ref = a + b, (c + d).indexOf(ref) >= 0) {
        e;
      }
    `);
  });

  it('works with negated `in`', () => {
    check(`
      a not in b
    `, `
      b.indexOf(a) < 0;
    `);
  });
});
