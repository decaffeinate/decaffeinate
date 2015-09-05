import check from './support/check';

describe('objects', () => {
  it('adds curly braces immediately around a single-line object', () => {
    check(`
      a b: c, d: e
    `, `
      a({b: c, d: e});
    `);
  });

  it.skip('indents and loosely wraps multi-line objects if needed', () => {
    check(`
      a: b
      c: d
    `, `
      ({
        a: b,
        c: d
      });
    `);
  });

  it.skip('adds curly braces loosely around a nested-object', () => {
    check(`
      a:
        b: c
    `, `
      ({
        a: {
          b: c
        }
      });
    `);
  });

  it.skip('uses concise methods for functions in objects', () => {
    check(`
      a: -> true
      b  :  -> false
    `, `
      ({
        a() { return true; },
        b() { return false; }
      });
    `);
  });
});
