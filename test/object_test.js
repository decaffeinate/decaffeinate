import check from './support/check.js';

describe('objects', () => {
  it('adds parentheses around implicit bare object literals', () => {
    check(`a: b`, `({a: b});`);
  });

  it('adds parentheses around explicit bare object literals', () => {
    check(`{a}`, `({a});`);
  });

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

  it('indents and loosely wraps multi-line objects if needed', () => {
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

  it('adds curly braces loosely around a nested object', () => {
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

  it('adds curly braces inside a function call', () => {
    check(`
      a b,
        c: d
        e: f
    `, `
      a(b, {
        c: d,
        e: f
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

  it('converts methods for fat arrow functions in objects properly', () => {
    check(`
      ({
        a: => @true
        b  :  => @false
      });
    `, `
      ({
        a: () => this.true,
        b  :  () => this.false
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

  it('adds opening and closing braces in the right places for multi-line objects in function calls', () => {
    check(`
      a
        a: b
        c: d
    `, `
      a({
        a: b,
        c: d
      });
    `);
  });

  it('transforms shorthand-this key-values to the appropriate key-value pair', () => {
    check(`
      {@a}
    `, `
      ({a: this.a});
    `);
  });

  it('adds the curly braces at the right place for implicitly-returned objects', () => {
    check(`
      ->
        b = 1
        d = 2
        a: b
        c: d
    `, `
      (function() {
        let b = 1;
        let d = 2;
        return {
          a: b,
          c: d
        };
      });
    `);
  });

  it('adds parentheses around an assignment whose LHS starts with an object', () => {
    check(`
      {a}.b = c
    `, `
      ({a}.b = c);
    `);
  });

  it('expands shorthand string-key object members', () => {
    check(`
      x = {"FOO", "BAR", "BAZ"}
    `, `
      let x = {"FOO": "FOO", "BAR": "BAR", "BAZ": "BAZ"};
    `);
  });

  it('expands shorthand string-key computed object members', () => {
    check(`
      x = {"a#{b}c"}
    `, `
      let ref;
      let x = {[ref = \`a\${b}c\`]: ref};
    `);
  });

  it('adds braces when implicit multi-line object is wrapped in parens', () => {
    check(`
      x = (
        a: b
        c: d
      )
    `, `
      let x = ({
        a: b,
        c: d
      });
    `);
  });

  it('adds braces when explicitly returning an implicit multi-line object wrapped in parens', () => {
    check(`
      ->
        return (
          a: b
          c: d
        )
    `, `
      () =>
        ({
          a: b,
          c: d
        })
      ;
    `);
  });

  it('adds braces when implicitly returning an implicit multi-line object wrapped in parens', () => {
    check(`
      ->
        (
          a: b
          c: d
        )
    `, `
      () =>
        ({
          a: b,
          c: d
        })
      ;
    `);
  });
});
