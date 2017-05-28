import check from './support/check';
import validate from './support/validate';

describe('unary operators', () => {
  it('passes unary minus through', () => {
    check(`-1`, `-1;`);
  });

  it('passes unary plus through', () => {
    check(`+1`, `+1;`);
  });

  it('passes bitwise negation through', () => {
    check(`~0`, `~0;`);
  });

  it('transforms `not` to `!` and removes the space if one is present', () => {
    check(`not a`, `!a;`);
  });

  it('transforms `not` to `!` with parentheses', () => {
    check(`not(a)`, `!(a);`);
  });

  it('passes double-not using `!` through', () => {
    check(`!!a`, `!!a;`);
  });

  it('transforms double-not using `not` to double-`!`', () => {
    check(`not not a`, `!!a;`);
  });

  it('transforms nested-nots with parentheses', () => {
    check(`not (!(not b))`, `!(!(!b));`);
  });

  it('transforms `not` to `!` when used in a condition', () => {
    check(`
      if not 0
        1
    `, `
      if (!0) {
        1;
      }
    `);
  });

  it('preserves typeof operators', () => {
    check(`typeof a`, `typeof a;`);
  });

  it('converts unary existential identifier checks to typeof + null check', () => {
    check(`a?`, `typeof a !== 'undefined' && a !== null;`);
  });

  it('converts unary existential identifier checks of known bindings to non-strict null check', () => {
    check(`
      (a) -> a?
    `, `
      a => a != null;
    `);
  });

  it('converts unary existential non-identifier to non-strict null check', () => {
    check(`a.b?`, `a.b != null;`);
    check(`0?`, `0 != null;`);
  });

  it('patches children of unary existential operators', () => {
    check(`(a b)?`, `(a(b)) != null;`);
  });

  it('surrounds unary existential operator results if needed', () => {
    check(`a? or b?`, `(typeof a !== 'undefined' && a !== null) || (typeof b !== 'undefined' && b !== null);`);
    check(`0? or 1?`, `(0 != null) || (1 != null);`);
    check(`(0?) or (1?)`, `(0 != null) || (1 != null);`);
  });

  it('converts unary existential operator and handles negation', () => {
    check(`
      unless a? and c
        b
    `, `
      if ((typeof a === 'undefined' || a === null) || !c) {
        b;
      }
    `);

    check(`
      unless a.b?
        b
    `, `
      if (a.b == null) {
        b;
      }
    `);
  });

  it('converts unary existential operator handling negation from a `not` prefix', () => {
    check(`
      (a) -> not a?
    `, `
      a => a == null;
    `);
  });

  it('properly respects precedence with a unary operator in a conditional', () => {
    check(`
      unless typeof a.b?
        c
    `, `
      if (!typeof (a.b != null)) {
        c;
      }
    `);
  });

  it('treats the increment operator as non-repeatable', () => {
    validate(`
      n = 1
      (n++)?.toString()
      setResult(n)
    `, 2);
  });
});
