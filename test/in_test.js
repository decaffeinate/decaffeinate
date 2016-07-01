import check from './support/check.js';

describe('in operator', () => {
  it('turns into an `indexOf` call', () => {
    check(`
      a in b
    `, `
      __in__(a, b);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('puts the left part first if it is potentially side-effecty', () => {
    check(`
      a.b in c
    `, `
      __in__(a.b, c);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('wraps element in parentheses if needed in a function argument', () => {
    check(`
      a(b, c.d in e)
    `, `
      a(b, __in__(c.d, e));
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('wraps list in parentheses if needed', () => {
    check(`
      a in b + c
    `, `
      __in__(a, b + c);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('works with a crazy case in an `if` statement', () => {
    check(`
      if a + b in c + d
        e
    `, `
      if (__in__(a + b, c + d)) {
        e;
      }
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('works with negated `in`', () => {
    check(`
      a not in b
    `, `
      !__in__(a, b);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('works with negated `in` in compound `or` expression', () => {
    check(`
      a or a not in b
    `, `
      a || !__in__(a, b);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('works with negated `in` in compound `and` expression', () => {
    check(`
      a and a not in b
    `, `
      a && !__in__(a, b);
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('handles negation with `unless`', () => {
    check(`
      unless a in b
        c
    `, `
      if (!__in__(a, b)) {
        c;
      }
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('handles negation with `if not`', () => {
    check(`
      if not (a in b)
        c
    `, `
      if (!(__in__(a, b))) {
        c;
      }
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });

  it('handles double negation with `unless`', () => {
    check(`
      unless a not in b
        c
    `, `
      if (__in__(a, b)) {
        c;
      }
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
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
      if (__in__(a, [])) {
        b;
      }
      function __in__(needle, haystack) {
        return haystack.indexOf(needle) >= 0;
      }
    `);
  });
});
