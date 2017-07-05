import check from './support/check';
import validate from './support/validate';

describe('in operator', () => {
  it('handles the simple identifier case', () => {
    check(`
      a in b
    `, `
      Array.from(b).includes(a);
    `);
  });

  it('skips Array.from in loose mode', () => {
    check(`
      a in b
    `, `
      b.includes(a);
    `, {
      options: {
        looseIncludes: true,
      }
    });
  });

  it('handles a property access as the LHS', () => {
    check(`
      a.b in c
    `, `
      Array.from(c).includes(a.b);
    `);
  });

  it('wraps element in parentheses if needed in a function argument', () => {
    check(`
      a(b, c.d in e)
    `, `
      a(b, Array.from(e).includes(c.d));
    `);
  });

  it('wraps list in parentheses if needed', () => {
    check(`
      a in b + c
    `, `
      Array.from(b + c).includes(a);
    `);
  });

  it('works with a crazy case in an `if` statement', () => {
    check(`
      if a + b in c + d
        e
    `, `
      if (Array.from(c + d).includes(a + b)) {
        e;
      }
    `);
  });

  it('works with negated `in`', () => {
    check(`
      a not in b
    `, `
      !Array.from(b).includes(a);
    `);
  });

  it('works with negated `in` in compound `or` expression', () => {
    check(`
      a or a not in b
    `, `
      a || !Array.from(b).includes(a);
    `);
  });

  it('works with negated `in` in compound `and` expression', () => {
    check(`
      a and a not in b
    `, `
      a && !Array.from(b).includes(a);
    `);
  });

  it('handles negation with `unless`', () => {
    check(`
      unless a in b
        c
    `, `
      if (!Array.from(b).includes(a)) {
        c;
      }
    `);
  });

  it('handles negation with `if not`', () => {
    check(`
      if not (a in b)
        c
    `, `
      if (!(Array.from(b).includes(a))) {
        c;
      }
    `);
  });

  it('handles double negation with `unless`', () => {
    check(`
      unless a not in b
        c
    `, `
      if (Array.from(b).includes(a)) {
        c;
      }
    `);
  });

  it('uses includes without Array.from for literal arrays', () => {
    check(`
      if a in [yes, no]
        b
    `, `
      if ([true, false].includes(a)) {
        b;
      }
    `);
  });

  it('uses includes without Array.from for literal arrays with negation', () => {
    check(`
      if a not in [yes, no]
        b
    `, `
      if (![true, false].includes(a)) {
        b;
      }
    `);
  });

  it('uses includes for a single element', () => {
    check(`
      if a in [yes]
        b
    `, `
      if ([true].includes(a)) {
        b;
      }
    `);
  });

  it('extracts a variable when the left side is not repeatable', () => {
    check(`
      if a() in [yes, no]
        b
    `, `
      let needle;
      if ((needle = a(), [true, false].includes(needle))) {
        b;
      }
    `);
  });

  it('extracts a variable when the right side is not repeatable', () => {
    check(`
      a in b()
    `, `
      let needle;
      (needle = a, Array.from(b()).includes(needle));
    `);
  });

  it('extracts a variable correctly for `not in` operations', () => {
    check(`
      a() not in b
    `, `
      let needle;
      (needle = a(), !Array.from(b).includes(needle));
    `);
  });

  it('uses includes with complicated expressions in the array', () => {
    check(`
      if a in [b and c, +d]
        e
    `, `
      if ([b && c, +d].includes(a)) {
        e;
      }
    `);
  });

  it('uses includes for empty arrays', () => {
    check(`
      if a in []
        b
    `, `
      if ([].includes(a)) {
        b;
      }
    `);
  });

  it('evaluates the expressions in order', () => {
    validate(`
      arr = []
      arr.push('first') in [arr.push('second')]
      setResult(arr)
    `, ['first', 'second'], { requireNode6: true });
  });

  it('handles an impure soak LHS', () => {
    check(`
      if a?.b() in c
        d
    `, `
      let needle;
      if ((needle = typeof a !== 'undefined' && a !== null ? a.b() : undefined, Array.from(c).includes(needle))) {
        d;
      }
    `);
  });

  it('respects the noArrayIncludes option', () => {
    check(`
      a in b
    `, `
      __in__(a, b);
      function __in__(needle, haystack) {
        return Array.from(haystack).indexOf(needle) >= 0;
      }
    `, {
      options: {
        noArrayIncludes: true,
      }
    });
  });
});
