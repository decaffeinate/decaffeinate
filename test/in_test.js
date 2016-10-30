import check from './support/check.js';

describe('in operator', () => {
  it('turns into an `indexOf` call', () => {
    check(`
      a in b
    `, `
      b.includes(a);
    `);
  });

  it('puts the left part first if it is potentially side-effecty', () => {
    check(`
      a.b in c
    `, `
      c.includes(a.b);
    `);
  });

  it('wraps element in parentheses if needed in a function argument', () => {
    check(`
      a(b, c.d in e)
    `, `
      a(b, e.includes(c.d));
    `);
  });

  it('wraps list in parentheses if needed', () => {
    check(`
      a in b + c
    `, `
      (b + c).includes(a);
    `);
  });

  it('works with a crazy case in an `if` statement', () => {
    check(`
      if a + b in c + d
        e
    `, `
      if ((c + d).includes(a + b)) {
        e;
      }
    `);
  });

  it('works with negated `in`', () => {
    check(`
      a not in b
    `, `
      !b.includes(a);
    `);
  });

  it('works with negated `in` in compound `or` expression', () => {
    check(`
      a or a not in b
    `, `
      a || !b.includes(a);
    `);
  });

  it('works with negated `in` in compound `and` expression', () => {
    check(`
      a and a not in b
    `, `
      a && !b.includes(a);
    `);
  });

  it('handles negation with `unless`', () => {
    check(`
      unless a in b
        c
    `, `
      if (!b.includes(a)) {
        c;
      }
    `);
  });

  it('handles negation with `if not`', () => {
    check(`
      if not (a in b)
        c
    `, `
      if (!(b.includes(a))) {
        c;
      }
    `);
  });

  it('handles double negation with `unless`', () => {
    check(`
      unless a not in b
        c
    `, `
      if (b.includes(a)) {
        c;
      }
    `);
  });

  it('turns into comparisons joined by logical operators for literal arrays', () => {
    check(`
      if a in [yes, no]
        b
    `, `
      if (a === true || a === false) {
        b;
      }
    `);
  });

  it('turns into comparisons joined by logical operators for literal arrays with negation', () => {
    check(`
      if a not in [yes, no]
        b
    `, `
      if (a !== true && a !== false) {
        b;
      }
    `);
  });

  it('turns into a single comparison literal arrays with a single element', () => {
    check(`
      if a in [yes]
        b
    `, `
      if (a === true) {
        b;
      }
    `);
  });

  it('turns into comparisons joined by logical operators for literal arrays with not-safe-to-repeat element', () => {
    check(`
      if a() in [yes, no]
        b
    `, `
      let ref;
      if ((ref = a()) === true || ref === false) {
        b;
      }
    `);
  });

  it('adds parens around elements that would be ambiguous', () => {
    check(`
      if a in [b and c, +d]
        e
    `, `
      if (a === (b && c) || a === +d) {
        e;
      }
    `);
  });

  it('uses the indexOf approach for empty arrays', () => {
    check(`
      if a in []
        b
    `, `
      if ([].includes(a)) {
        b;
      }
    `);
  });
});
