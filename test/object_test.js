import check from './support/check';

describe('objects', () => {
  it('adds curly braces immediately around a single-line object', () => {
    check(`
      a b: c, d: e
    `, `
      a({b: c, d: e});
    `);
  });

  it('allows objects as conditional consequents', () => {
    check(`
      if a then { b: c }
    `, `
      if (a) { ({ b: c }); }
    `);
  });

  it('allows objects as conditional alternates', () => {
    check(`
      if a then b else { c: d }
    `, `
      if (a) { b; } else { ({ c: d }); }
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

  it('uses concise methods for functions in objects', () => {
    check(`
      a: -> true
      b  :  -> false
    `, `
      ({a() { return true; },
      b() { return false; }});
    `);
  });

  it.skip('handles quoted strings as keys', () => {
    check(`
      write 301, '', 'Location': pathname+'/'
    `, `
      write(301, '', {'Location': pathname+'/'});
    `);
  });
});
