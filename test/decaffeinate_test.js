import check from './support/check';

describe('automatic conversions', function() {
  describe('inserting commas', function() {
    it('does not add commas after block comments', function() {
      check(`
        {
          a: b
          ###
          # no comma
          ###
          c: d
        }
      `, `
        ({
          a: b,
          /*
           * no comma
           */
          c: d
        });
      `
      );
    });

    describe('in objects', function() {
      it('inserts commas after properties if they are not there', function() {
        check(`
          {
            a: b
            c: d
          }
        `, `
          ({
            a: b,
            c: d
          });
        `);
      });

      it('does not insert commas if there already is one', function() {
        check(`
          {
            a: b,
            c: d
          }
        `, `
          ({
            a: b,
            c: d
          });
        `);
      });

      it('does not insert commas in single-line objects', function() {
        check(`{ a: b, c: d }`, `({ a: b, c: d });`);
      });

      it('inserts commas only for objects that end a line', function() {
        check(`
          {
            a: b, c: d
            e: f
            g: h
          }
        `, `
          ({
            a: b, c: d,
            e: f,
            g: h
          });
        `);
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check(`
          {
            a: b # hi!
            c: d
          }
        `, `
          ({
            a: b, // hi!
            c: d
          });
        `);
      });

      it('inserts commas after shorthand properties', function() {
        check(`
          {
            a
            c
          }
        `, `
          ({
            a,
            c
          });
        `);
      });

      it('inserts commas for braceless objects', function() {
        check(`
          a: b
          c: d
        `, `
          ({a: b,
          c: d
          });
        `);
      });
    });
  });

  describe('adding variable declarations', function() {
    it('does add the default value when they is any', function() {
      check(`(a=2) -> a`, `(function(a=2) { return a; });`);
    });

    it('works with conditions and NEQOp', function() {
      check(`
        b = if (a? and a!="") then 1
      `, `
        var b = (typeof a !== "undefined" && a !== null) && a!=="") ? 1 : undefined;
      `);
    });

    it('works with multiple pluses', function() {
      check(`a="b"+"c"+"d"`, `var a="b"+"c"+"d";`);
    });

    it('works with 4 ands in a row', function() {
      check(`a = b && !c && d && e()`, `var a = b && !c && d && e();`);
    });

    it('works with 4 pluses in a row', function() {
      check(`a="b"+"c"+"d"+"e"`, `var a="b"+"c"+"d"+"e";`);
    });

    it('works with star multiply', function() {
      check(`a=1*2`, `var a=1*2;`);
    });

    it('works with multiple star multiply', function() {
      check(`a=1*2*3`, `var a=1*2*3;`);
    });

    it('works with triple quotes', function() {
      check(`a="""hello #{world}"""`, 'var a=`hello ${world}`;');
    });
  });

  describe('adding explicit returns', function() {
    it('adds a return for the only expression in functions', function() {
      check(`a = -> 1`, `var a = function() { return 1; };`);
    });

    it('does not add a return when one is already there', function() {
      check(`a = -> return 1`, `var a = function() { return 1; };`);
    });

    it('adds a return for the final expression in functions', function() {
      check(`
        a = ->
          1
          2
      `, `
        var a = function() {
          1;
          return 2;
        };
      `);
    });
  });

  describe('changing keywords', function() {

    it('renames "and" to "&&"', function() {
      check(`a and b`, `a && b;`);
    });

    it('renames "or" to "||"', function() {
      check(`a or b`, `a || b;`);
    });
  });

  describe('changing string interpolation to template strings', function() {
    it('rewrites interpolations with #{} to ${}', function() {
      check('"a#{b}c"', '`a${b}c`;');
    });

    it('rewrites interpolations with spaces after the "{"', function() {
      check('"a#{ b }c"', '`a${ b }c`;');
    });

    it('can return interpolated strings', function() {
      check(`-> "#{a}"`, `(function() { return \`\${a}\`; });`);
    });
  });

  describe('dealing with `undefined`', function() {
    it('leaves as-is', function() {
      check(`undefined`, `undefined;`);
    });
  });

  describe('dealing with floating point numbers', function() {
    it('leaves as-is', function() {
      check(`1.0`, `1.0;`);
    });
  });

  describe('adding semi-colons', function() {
  });

  describe('converting all at once', function() {
    it('adds semicolons after call parentheses', function() {
      check(`Ember = require "ember"`, `var Ember = require("ember");`);
    });

    it('adds braces to implicit object literals', function() {
      check(`a b: c`, `a({b: c});`);
    });

    it('adds parentheses around implicit bare object literals', function() {
      check(`a: b`, `({a: b});`);
    });

    it('adds parentheses around explicit bare object literals', function() {
      check(`{a}`, `({a});`);
    });

    it('adds object braces to the last function argument even if there are parentheses', function() {
      check(`a(b: c)`, `a({b: c});`);
    });

    it('does not add parentheses to objects that are implicit returns', function() {
      check(`
        ->
          {a: b}
      `, `
        (function() {
          return {a: b};
        });
      `);
    });

    it('turns `;`-separated sequences into `,`-separated sequences', function() {
      check('a; b', 'a, b;');
    });

    it('handles object literals with function property values', function() {
      check(`
        a
          b: ->
            c

          d: 1
      `, `
        a({
          b() {
            return c;
          },

          d: 1
        });
      `);
    });

    it('handles object literals with function property values followed by comments', function() {
      check(`
        a
          b: ->
            c

        # FOO
        d e
      `, `
        a({
          b() {
            return c;
          }
        });

        // FOO
        d(e);
      `);
    });

    it('leaves bitwise operators alone', function() {
      check(`a & b`, `a & b;`);
      check(`a | b`, `a | b;`);
      check(`a ^ b`, `a ^ b;`);
    });

    it('converts unary existential identifier checks to typeof + null check', function() {
      check(`a?`, `typeof a !== "undefined" && a !== null;`);
    });

    it('converts unary existential non-identifier to non-strict null check', function() {
      check(`a.b?`, `a.b != null;`);
      check(`0?`, `0 != null;`);
    });

    it('surrounds unary existential operator results if needed', function() {
      check(`a? or b?`, `(typeof a !== "undefined" && a !== null) || (typeof b !== "undefined" && b !== null);`);
      check(`0? or 1?`, `(0 != null) || (1 != null);`);
    });

    it('passes `null` through as-is', function() {
      check(`null`, `null;`);
    });

    it('strips the backticks off interpolated JavaScript in a statement context', function() {
      check('`var a = 1;`', 'var a = 1;');
    });

    it('strips the backticks off interpolated JavaScript in an expression context', function() {
      check('a = `void 0`', 'var a = void 0;');
    });

    it('handles simple binary existential operators', function() {
      check(`a ? b`, `if ((typeof a !== "undefined" && a !== null)) { a; } else { b; }`);
    });

    it('deals gracefully with extra parens in simple binary existential operators', function() {
      check(`a ? (b)`, `if ((typeof a !== "undefined" && a !== null)) { a; } else { b; }`);
    });

    it('handles complex binary existential operators', function() {
      check(
        `@a ? @b`,
      `
        var ref;
        if (((ref = this.a) != null)) { ref; } else { this.b; }
      `);
    });

    it('deals gracefully with extra parens in complex binary existential operators', function() {
      check(
        `@a ? (@b)`,
        `
         var ref;
         if (((ref = this.a) != null)) { ref; } else { this.b; }
        `
      );
    });

    it('prevents using temporary variables that clash with existing bindings', function() {
      check(`
        ref = 1
        @a ? @b
      `, `
        var ref1;
        var ref = 1;
        if (((ref1 = this.a) != null)) { ref1; } else { this.b; }
      `);
    });

    it('prevents using temporary variables that clash with existing temporary variables', function() {
      check(`
        @a ? @b
        @c ? @d
      `, `
        var ref;
        var ref1;
        if (((ref = this.a) != null)) { ref; } else { this.b; }
        if (((ref1 = this.c) != null)) { ref1; } else { this.d; }
      `);
    });

    it('handles bad range information provided by CoffeeScriptRedux', function() {
      // This source code creates bad range information for the MemberAccessOp.
      check(`
         (-> 42).observes('model')
      `, `
         (function() { return 42; }).observes('model');
      `);
    });

    it('preserves typeof operators', function() {
      check(`typeof a`, `typeof a;`);
    });
  });
});
