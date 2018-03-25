import check, {checkCS2} from './support/check';

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
      }
      );
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

  it('does not use computed properties for method keys', () => {
    check(`
      ({
        'a': -> b
      })
    `, `
      ({
        'a'() { return b; }
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

  it('does not use computed properties for number keys', () => {
    check(`
      { 0: 1, 3.14: 0 }
    `, `
      ({ 0: 1, 3.14: 0 });
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
        const b = 1;
        const d = 2;
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
      const x = {"FOO": "FOO", "BAR": "BAR", "BAZ": "BAZ"};
    `);
  });

  it('expands shorthand string-key computed object members', () => {
    check(`
      x = {"a#{b}c"}
    `, `
      const x = {[\`a\${b}c\`]: \`a\${b}c\`};
    `);
  });

  it('expands shorthand string-key computed object members with a non-repeatable interpolation', () => {
    check(`
      x = {"a#{b()}c"}
    `, `
      let ref;
      const x = {[ref = \`a\${b()}c\`]: ref};
    `);
  });

  it('adds braces when implicit multi-line object is wrapped in parens', () => {
    check(`
      x = (
        a: b
        c: d
      )
    `, `
      const x = ({
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

  it('adds brackets around template literals', () => {
    check(`
      {"a#{b}c": d}
    `, `
      ({[\`a\${b}c\`]: d});
    `);
  });

  it('adds brackets around multiline herestrings', () => {
    check(`
      {"""a
      b""": c}
    `, `
      ({[\`a
      b\`]: c});
    `);
  });

  it('special-cases template literals with only a single expression', () => {
    check(`
      {"#{a.b}": c}
    `, `
      ({[a.b]: c});
    `);
  });

  it('handles methods where the function is surrounded by parens', () => {
    check(`
      x: (-> x)
    `, `
      ({x() { return x; }});
    `);
  });

  it('handles an implicit object inside an array', () => {
    check(`
      [
        a: b
        c: d
      ]
    `, `
      [{
        a: b,
        c: d
      }
      ];
    `);
  });

  it('allows semicolon delimiters between object values', () => {
    check(`
      {a: b, c: d; e: f, g: h;}
    `, `
      ({a: b, c: d, e: f, g: h,});
    `);
  });

  it('handles implicit objects after an existence operator in an expression context', () => {
    check(`
      a = b ?
        c: d
        e: f
    `, `
      const a = typeof b !== 'undefined' && b !== null ? b : {
        c: d,
        e: f
      };
    `);
  });

  it('handles implicit objects after an existence operator in a statement context', () => {
    check(`
      a ?
        b: c
        d: e
    `, `
      if (typeof a === 'undefined' || a === null) { ({
          b: c,
          d: e
        }); }
    `);
  });

  it('handles nested implicit objects in a conditional expression', () => {
    check(`
      x = if count then {a: b: c} else {d: e: f}
    `, `
      const x = count ? {a: {b: c}} : {d: {e: f}};
    `);
  });

  it('handles nested implicit objects in a conditional statement', () => {
    check(`
      if count then {a: b: c} else {d: e: f}
    `, `
      if (count) { ({a: {b: c}}); } else { ({d: {e: f}}); }
    `);
  });

  it('handles an object with function values ending in semicolons', () => {
    check(`
      {
        a: ->
          b;
        c: ->
          d;
      }
    `, `
      ({
        a() {
          return b;
        },
        c() {
          return d;
        }
      });
    `);
  });

  it('handles an object with parenthesized function values ending in semicolons', () => {
    check(`
      {
        a: ->
          (b);
        c: ->
          (d);
      }
    `, `
      ({
        a() {
          return (b);
        },
        c() {
          return (d);
        }
      });
    `);
  });

  it('handles an object with semicolons on the next line', () => {
    check(`
      {
        a: ->
          b
          ;
        c: ->
          d
          ;
      }
    `, `
      ({
        a() {
          return b;
        },
          
        c() {
          return d;
        }
          
      });
    `);
  });

  it('handles nested objects with an inner statement ending in a semicolon', () => {
    check(`
      a:
        b: ->
          c;
    `, `
      ({
        a: {
          b() {
            return c;
          }
        }
      });
    `);
  });

  it('handles an object literal ending in a semicolon', () => {
    check(`
      o = 
        a: 1
        b: 2;
    `, `
      const o = { 
        a: 1,
        b: 2
      };
    `);
  });

  it('handles an implicit object arg ending in a comma', () => {
    check(`
      a
        b: c,
    `, `
      a({
        b: c});
    `);
  });

  it('correctly handles comma-separated implicit object args', () => {
    check(`
      somefunc 
        hey: 1,
        yo: 2,
      ,
        sup: 2,
        friend: 3
    `, `
      somefunc({ 
        hey: 1,
        yo: 2
      }
      , {
        sup: 2,
        friend: 3
      }
      );
    `);
  });

  it('allows complex CS2 computed property keys', () => {
    checkCS2(`
      o = {
        [a b]: c
      }
    `, `
      const o = {
        [a(b)]: c
      };
    `);
  });

  it('allows simple shorthand computed property keys', () => {
    checkCS2(`
      o = {
        [a]
      }
    `, `
      const o = {
        [a]: a
      };
    `);
  });

  it('allows complex shorthand computed property keys', () => {
    checkCS2(`
      o = {
        [a b]
      }
    `, `
      let ref;
      const o = {
        [ref = a(b)]: ref
      };
    `);
  });
});
