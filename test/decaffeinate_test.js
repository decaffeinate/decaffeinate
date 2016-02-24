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
  });
});
