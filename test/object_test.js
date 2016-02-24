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

  it('inserts commas between object members if absent', () => {
    check(`
      ({
        a: b
        c: d
      })
    `, `
      ({
        a: b,
        c: d
      });
    `);
  });

  it.skip('indents and loosely wraps multi-line objects if needed', () => {
    check(`
      a: b,
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
      ({
        a: -> true
        b  :  -> false
      });
    `, `
      ({
        a() { return true; },
        b() { return false; }
      });
    `);
  });

  it('uses computed methods for string keys', () => {
    check(`
      ({
        'a': -> b
      })
    `, `
      ({
        ['a']() { return b; }
      });
    `);
  });

  it('does not use computed properties for string keys with non-function values', () => {
    check(`
      {
        'a': b
      }
    `, `
      ({
        'a': b
      });
    `);
  });

  it('handles quoted strings as keys', () => {
    check(`
      write 301, '', 'Location': pathname+'/'
    `, `
      write(301, '', {'Location': pathname+'/'});
    `);
  });

  it('adds braces to implicit objects that are not the first argument', () => {
    check(`
      a b, c: d
    `, `
      a(b, {c: d});
    `);
  });

  it('adds braces to implicit objects that are not the last argument', () => {
    check(`
      a b: c, d
    `, `
      a({b: c}, d);
    `);
  });

  it('adds braces to implicit objects that are in the middle of the arguments', () => {
    check(`
      a b, c: d, e
    `, `
      a(b, {c: d}, e);
    `);
  });

  it('does not add braces to explicit object arguments', () => {
    check(`
      a {b}, {c}, {d}
    `, `
      a({b}, {c}, {d});
    `);
  });

  it('does not stick braces to opening parentheses for leading argument objects', () => {
    check(`
      a(
        b: c
        d
      )
    `, `
      a(
        {b: c},
        d
      );
    `);
  });

  it('does not stick braces to closing parentheses for trailing argument objects', () => {
    check(`
      a(
        b
        c: d
      )
    `, `
      a(
        b,
        {c: d}
      );
    `);
  });

  it('transforms shorthand-this key-values to the appropriate key-value pair', () => {
    check(`
      {@a}
    `, `
      ({a: this.a});
    `);
  });
});
