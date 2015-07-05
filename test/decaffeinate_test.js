import { convert } from '../src/index';
import { strictEqual } from 'assert';

const WHITESPACE = /^\s*$/;

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
          /**
          * no comma
           */
          c: d
        });
      `
      );
    });

    describe('in arrays', function() {
      it('inserts commas at the end of lines that would have them in JavaScript', function() {
        check(`
          [
            1
            2
          ]
        `, `
          [
            1,
            2
          ];
        `);
      });

      it('does not insert commas if there already is one', function() {
        check(`
          [
            1,
            2
          ]
        `, `
          [
            1,
            2
          ];
        `);
      });

      it('does not insert commas in single-line arrays', function() {
        check(`[ 1, 2 ]`, `[ 1, 2 ];\n`);
      });

      it('inserts commas only for objects that end a line', function() {
        check(`
          [
            1, 2
            3
            4
          ]
        `, `
          [
            1, 2,
            3,
            4
          ];
        `);
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check(`
          [
            1 # hi!
            2
          ]
        `, `
          [
            1, // hi!
            2
          ];
        `);
      });

      it('inserts commas in nested arrays', function() {
        check(`
          [
            [
              1
              2
            ]
            3
          ]
        `, `
          [
            [
              1,
              2
            ],
            3
          ];
        `);
      });
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
          c: d});
        `);
      });
    });

    describe('in function calls', function() {
      it('inserts commas after arguments if they are not there', function() {
        check(`
          a(
            1
            2
          )
        `, `
          a(
            1,
            2
          );
        `);
      });

      it('does not insert commas in single-line calls', function() {
        check(`a(1, 2)`, `a(1, 2);`);
      });

      it('inserts commas only for arguments that end a line', function() {
        check(`
          a(
            1, 2
            3, 4)
        `, `
          a(
            1, 2,
            3, 4);
        `);
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check(`
          a(
            1 # hi
            2
          )
        `, `
          a(
            1, // hi
            2
          );
        `);
      });

      it('inserts commas on the same line when the property value is an interpolated string', function() {
        check(`
          a
            b: "#{c}"
            d: e
        `, `
          a({
            b: \`\${c}\`,
            d: e
          });
        `);
      });
    });
  });

  describe('inserting function call parentheses', function() {
    it('replaces the space between the callee and the first argument for first arg on same line', function() {
      check(`a 1, 2`,  `a(1, 2);`);
    });

    it('does not add anything if there are already parens', function() {
      check(`a()`, `a();`);
      check(`a(1, 2)`, `a(1, 2);`);
    });

    it('adds parens for nested function calls', function() {
      check(`a   b  c d     e`, `a(b(c(d(e))));`);
    });

    it('adds parens for a new expression with args', function() {
      check(`new Foo 1`, `new Foo(1);`);
    });

    it('adds parens for a new expression without args', function() {
      check(`new Foo`, `new Foo();`);
    });

    it('adds parens after the properties of a member expression', function() {
      check(`a.b c`, `a.b(c);`);
    });

    it('adds parens after the brackets on a computed member expression', function() {
      check(`a b[c]`, `a(b[c]);`);
    });

    it('adds parens without messing up multi-line calls', function() {
      check(`
        a
          b: c
      `, `
        a({
          b: c
        });
      `);
    });

    it('adds parens to multi-line calls with the right indentation', function() {
      check(`
        ->
          a
            b: c
      `, `
        (function() {
          return a({
            b: c
          });
        });
      `);
    });
  });

  describe('changing shorthand this to longhand this', function() {
    it('changes shorthand member expressions to longhand member expressions', function() {
      check(`a = @a`, `var a = this.a;`);
    });

    it('changes shorthand computed member expressions to longhand computed member expressions', function() {
      check(`a = @[a]`, `var a = this[a];`);
    });

    it('changes shorthand standalone this to longhand standalone this', function() {
      check(`bind(@)`, `bind(this);`);
    });

    it('does not change longhand this', function() {
      check(`this.a`, `this.a;`);
    });

    it('does not change "@" in strings', function() {
      check(`"@"`, `"@";`);
    });

    it('does not add a dot to the shorthand prototype operator', function() {
      check(`@::a`, `this.prototype.a;`);
    });

    it('does not double-expand nested member expressions', function() {
      check(`@a.b`, `this.a.b;`);
    });

    it('does not double-expand nested computed member expressions', function() {
      check(`@[a].b`, `this[a].b;`);
    });

    it('does not double-expand nested prototype access member expressions', function() {
      check(`@::a.b`, `this.prototype.a.b;`);
    });
  });

  describe('changing prototype member access into normal member access', function() {
    it('replaces prototype member access', function() {
      check(`A::b`, `A.prototype.b;`);
    });

    it('works in combination with the shorthand this patcher', function() {
      check(`@::b`, `this.prototype.b;`);
    });
  });

  describe('adding variable declarations', function() {
    it('adds variable declarations for assignments', function() {
      check(`a = 1`, `var a = 1;`);
    });

    it('adds variable declarations for only the creating binding', function() {
      check(`
        a = 1
        a = 2
      `, `
        var a = 1;
        a = 2;
      `);
    });

    it('does not add variable declarations for reassignments in functions', function() {
      check(`
        a = 1
        ->
          a = 2
      `, `
        var a = 1;
        (function() {
          return a = 2;
        });
      `);
    });

    it('does not add variable declarations for reassignments of function params', function() {
      check(`(a) -> a = 1`, `(function(a) { return a = 1; });`);
    });

    it('does not add variable declarations when the LHS is a member expression', function() {
      check(`a.b = 1`, `a.b = 1;`);
    });

    it('adds variable declarations for destructuring array assignment', function() {
      check(`[a] = b`, `var [a] = b;`);
    });

    it('adds variable declarations for destructuring object assignment', function() {
      check(`{a} = b`, `var {a} = b;`);
    });

    it('does not add variable declarations for destructuring array assignment with previously declared bindings', function() {
      check(`
        a = 1
        [a] = b
      `, `
        var a = 1;
        [a] = b;
      `);
    });

    it('wraps object destructuring that is not part of a variable declaration in parentheses', function() {
      check(`
        a = 1
        {a} = b
      `, `
        var a = 1;
        ({a}) = b;
      `);
    });

    it('adds variable declarations when the destructuring is mixed', function() {
      // FIXME: Is this a good idea? Should we be marking this as an error?
      check(`
        a = 1
        [a, b] = c
      `, `
        var a = 1;
        var [a, b] = c;
      `);
    });

    it('adds pre-declarations when the assignment is in an expression context', function() {
      check(`a(b = c)`, `var b;\na(b = c);`);
    });

    it('adds pre-declarations when the assignment would be implicitly returned', function() {
      check('->\n  a = 1', '(function() {\n  var a;\n  return a = 1;\n});');
    });

    it('adds pre-declarations at the right indent level when the assignment is in an expression context', function() {
      check(`->\n  a(b = c)`, `(function() {\n  var b;\n  return a(b = c);\n});`);
    });

    it('adds pre-declarations and regular declarations together properly', function() {
      check('a = 1\nb = c = 2', 'var c;\nvar a = 1;\nvar b = c = 2;');
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
    it('renames "yes" to "true"', function() {
      check(`a = yes`, `var a = true;`);
    });

    it('renames "no" to "false"', function() {
      check(`a = no`, `var a = false;`);
    });

    it('renames "and" to "&&"', function() {
      check(`a and b`, `a && b;`);
    });

    it('renames "or" to "||"', function() {
      check(`a or b`, `a || b;`);
    });

    it('renames "not" to "!" and removes the space if one is present', function() {
      check(`not a`, `!a;`);
    });

    it('renames "not" to "!"', function() {
      check(`not(a)`, `!(a);`);
    });

    it.skip('handles chained "not"s', function() {
      // This seems to trigger a CoffeeScriptRedux bug.
      // The inner LogicalNotOp has no raw/range.
      check(`not not a`, `!!a;`);
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
    it('adds them after call expressions as statements', function() {
      check(`a b`, `a(b);`);
    });

    it('does not add them when they are already present', function() {
      check(`a b; c d`, `a(b), c(d);`);
    });

    it('does not add them when they are already present following whitespace', function() {
      check(`a b ; c d`, `a(b) , c(d);`);
    });

    it('adds them after identifiers as statements', function() {
      check(`a`, `a;`);
    });

    it('adds them after assignments', function() {
      check(`a = 1`, `var a = 1;`);
    });

    it('does not add them after `if` statements', function() {
      check(`
        if a
          b
      `, `
        if (a) {
          b;
        }
      `);
    });

    it('does not add them after `for` loops', function() {
      check(`
        for a in b
          a
      `, `
          for a in b
            a;
      `);
      check(`
        for a of b
          a
      `, `
        for a of b
          a;
      `);
    });

    it('does not add them after `while` loops', function() {
      check(`
        while a
          a
      `, `
        while a
          a;
      `);
    });

    it('does not add them after `loop` loops', function() {
      check(`
        loop
          a
      `, `
        loop
          a;
      `);
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

    it('leaves fat arrow functions as arrow functions', function() {
      check(`add = (a, b) => a + b`, `var add = (a, b) => a + b;`);
    });

    it('adds a block to fat arrow functions if their body is a block', function() {
      check(`
        add = (a, b) =>
          a + b
      `, `
        var add = (a, b) => {
          return a + b;
        };
      `);
    });

    it('turns `;`-separated sequences into `,`-separated sequences', function() {
      check('a; b', 'a, b;');
    });

    it('wraps the body of fat arrow functions if the body is a sequence', function() {
      check(`=> a; b`, `() => (a, b);`);
    });

    it('handles functions without a body', function() {
      check(`->`, `(function() {});`);
    });

    it('handles object literals with function property values', function() {
      check(`
        a
          b: ->
            c

          d: 1
      `, `
        a({
          b: function() {
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
          b: function() {
            return c;
          }
        });

        // FOO
        d(e);
      `);
    });

    it('converts line comments to // form', function() {
      check(`
        # foo
        1
      `, `
        // foo
        1;
      `);
    });

    it('converts non-doc block comments to /* */', function() {
      check(`
        a(
          ###
          HEY
          ###
          1
        )
      `, `
        a(
          /*
          HEY
          */
          1
        );
      `);
    });

    it('converts doc block comments to /** */', function() {
      check(`
        a(
          ###
          # HEY
          ###
          1
        )
      `, `
        a(
          /**
          * HEY
           */
          1
        );
      `);
    });

    it('converts equality operator to triple-equal operator', function() {
      check(`a == b`, `a === b;`);
      check(`a is b`, `a === b;`);
    });

    it('converts negative equality operator to triple-not-equal operator', function() {
      check(`a != b`, `a !== b;`);
      check(`a isnt b`, `a !== b;`);
    });

    it('leaves less-than operators alone', function() {
      check(`a < b`, `a < b;`);
      check(`a <= b`, `a <= b;`);
    });

    it('leaves greater-than operators alone', function() {
      check(`a > b`, `a > b;`);
      check(`a >= b`, `a >= b;`);
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

    it('converts named classes without bodies', function() {
      check(`class A`, `class A {}`);
    });

    it('converts anonymous classes without bodies wrapped in parentheses', function() {
      check(`class`, `(class {});`);
    });

    it('preserves class body functions as method definitions', function() {
      check(`
        class A
          a: ->
            1
      `, `
        class A {
          a() {
            return 1;
          }
        }
      `);
      check(`
        ->
          class A
            a: ->
              1
      `, `
        (function() {
          return class A {
            a() {
              return 1;
            }
          };
        });
      `);
    });

    it('preserves class constructors without arguments', function() {
      check(`
        class A
          constructor: ->
            @a = 1
      `, `
        class A {
          constructor() {
            return this.a = 1;
          }
        }
      `);
    });

    it('preserves class constructors with arguments', function() {
      check(`
        class A
          constructor: (a) ->
            @a = a
      `, `
        class A {
          constructor(a) {
            return this.a = a;
          }
        }
      `);
    });

    it('preserves `throw` when used in a statement context', function() {
      check(`throw new Error()`, `throw new Error();`);
    });

    it('wraps `throw` in an IIFE when used in an expression context', function() {
      check(`doSomething() or (throw err)`, `doSomething() || (() => { throw err; })();`);
    });

    it('passes `null` through as-is', function() {
      check(`null`, `null;`);
    });

    it('converts spread by moving ellipsis to beginning in function calls', function() {
      check(`a(b...)`, `a(...b);`);
      check(`a(1, 2, makeArray(arguments...)...)`, `a(1, 2, ...makeArray(...arguments));`);
    });

    it('converts spread by moving ellipsis to beginning in array literals', function() {
      check(`[b...]`, `[...b];`);
      check(`[1, 2, makeArray(arguments...)...]`, `[1, 2, ...makeArray(...arguments)];`);
    });

    it('converts rest params in function calls', function() {
      check(`(a,b...)->b[0]`, `(function(a,...b){return b[0]; });`);
    });

    it('surrounds `if` conditions in parentheses and bodies in curly braces', function() {
      check(`
        if a
          b
      `, `
        if (a) {
          b;
        }
      `);
    });

    it('surrounds `unless` conditions in parentheses and precedes it with a `!` operator', function() {
      check(`
        unless a
          b
      `, `
        if (!a) {
          b;
        }
      `);
    });

    it('surrounds `unless` conditions in additional parentheses if needed for the `!` operator', function() {
      check(`
        unless a == b
          c
      `, `
        if (!(a === b)) {
          c;
        }
      `);
    });

    it('does not add parentheses if the condition is already surrounded by them', function() {
      check(`
        if (a)
          b
      `, `
        if (a) {
          b;
        }
      `);
      check(`
        unless (a)
          b
      `, `
        if (!a) {
          b;
        }
      `);
    });

    it('correctly inserts parentheses when an `unless` condition requires them when it was surrounded by parentheses', function() {
      check(`
        unless (a == b)
          c
      `, `
        if (!(a === b)) {
          c;
        }
      `);
    });

    it('handles indented `if` statements correctly', function() {
      check(`
        if a
          if b
            c
      `, `
        if (a) {
          if (b) {
            c;
          }
        }
      `);
    });

    it('surrounds the `else` clause of an `if` statement in curly braces', function() {
      check(`
        if a
          b
        else
          c
      `, `
        if (a) {
          b;
        } else {
          c;
        }
      `);
    });

    it('surrounds the `else if` condition in parentheses', function() {
      check(`
        if a
          b
        else if c
          d
      `, `
        if (a) {
          b;
        } else if (c) {
          d;
        }
      `);
    });

    it('works with several `else if` clauses and an `else`', function() {
      check(`
        if a
          b
        else if c
          d
        else if e
          f
        else
          g
      `, `
        if (a) {
          b;
        } else if (c) {
          d;
        } else if (e) {
          f;
        } else {
          g;
        }
      `);
    });

    it('works with `if` with immediate return', function() {
      check(`
        ->
          if a
            b
        c
      `,`
        (function() {
          if (a) {
            return b;
          }
        });
        c;
      `);
    });

    it('keeps single-line `if` statements on one line', function() {
      check(`if a then b`, `if (a) { b; }`);
    });

    it('keeps single-line `if` with `else` on one line', function() {
      check(`if a then b else c`, `if (a) { b; } else { c; }`);
    });

    it('turns simple `if` with `else` as an expression into a ternary operator', function() {
      check(`a(if b then c else d)`, `a(b ? c : d);`);
    });

    it('turns simple `if` without `else` as an expression into a ternary operator with undefined', function() {
      check(`a(if b then c)`, `a(b ? c : undefined);`);
    });

    it('keeps single-line POST-`if`', function() {
      check(`a if b`, `if (b) { a; }`);
      check(`
        ->
          return if a is b
          null
        `, `
          (function() {
            if (a === b) { return; }
            return null;
          });
      `);
    });

    it('keeps single-line POST-`unless`', function() {
      check(`a unless b`, `if (!b) { a; }`);
    });

    it('pushes returns into `if` statements', function() {
      check(`
        ->
          if a
            b
      `, `
        (function() {
          if (a) {
            return b;
          }
        });
      `);
    });

    it('pushes returns into `else if` blocks', function() {
      check(`
        ->
          if a
            b
          else if c
            d
      `, `
        (function() {
          if (a) {
            return b;
          } else if (c) {
            return d;
          }
        });
      `);
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

    it('converts soaked member access to a conditional', function() {
      check(`
        a?.b()
      `, `
        if ((typeof a !== "undefined" && a !== null)) { a.b(); }
      `);
    });

    it('converts a complex soaked member access to a conditional with an assignment in the condition', function() {
      check(`
        a.b?.c
      `, `
        var ref;
        if (((ref = a.b) != null)) { ref.c; }
      `);
    });

    it('allows soaked member access to be used in an expression', function() {
      check(`
        a(b?.c)
      `, `
        a(((typeof b !== "undefined" && b !== null) ? b.c : undefined));
      `);
    });

    it('converts dynamic soaked member access to a conditional', function() {
      check(`
        a?[b]()
      `, `
        if ((typeof a !== "undefined" && a !== null)) { a[b](); }
      `);
    });

    it('wraps soaked member access if necessary', function() {
      check(`
        if a?.b then c
      `, `
        if ((typeof a !== "undefined" && a !== null) ? a.b : undefined) { c; }
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

    it('passes regular expressions through as-is', function() {
      check(`a = /foo\s/`, `var a = /foo\s/;`);
    });

    it('rewrites block regular expressions as normal regular expressions', function() {
      check(`
        a = ///
          foo .*
          bar
        ///
      `, `
        var a = /foo.*bar/;
      `);
    });

    it('preserves slash escapes in regular expressions', function() {
      check(`a = /foo\\/bar/`, `var a = /foo\\/bar/;`);
    });

    it('preserves regular expression flags', function() {
      check(`a = /a/ig`, `var a = /a/ig;`);
    });

    it('preserves typeof operators', function() {
      check(`typeof a`, `typeof a;`);
    });

    it('handles multi-line try/catch with catch assignee', function() {
      check(`
        try
          a()
        catch ex
          b()
      `, `
        try {
          a();
        } catch (ex) {
          b();
        }
      `);
    });

    it('handles indented multi-line try/catch with catch assignee', function() {
      check(`
        ->
          try
            a()
          catch ex
            b()
      `, `
        (function() {
          try {
            return a();
          } catch (ex) {
            return b();
          }
        });
      `);
    });

    it('handles multi-line try/catch without catch assignee', function() {
      check(`
        try
          a()
        catch
          b()
      `, `
        try {
          a();
        } catch (_error) {
          b();
        }
      `);
    });

    it('handles multi-line try without catch clause without finally clause', function() {
      check(`
        try
          a()
      `, `
        try {
          a();
        } catch (_error) {
        }
      `);
    });

    it('handles multi-line indented try without catch clause without finally clause', function() {
      check(`
        ->
          try
            a()
      `, `
        (function() {
          try {
            return a();
          } catch (_error) {
          }
        });
      `);
    });

    it('handles multi-line try without catch clause with finally clause', function() {
      check(`
        try
          a()
        finally
          b()
      `, `
        try {
          a();
        } finally {
          b();
        }
      `);
    });
  });

  function check(source, expected) {
    strictEqual(convert(stripSharedIndent(source)), stripSharedIndent(expected));
  }

  /**
   * Removes indentation shared by all lines.
   *
   * @param {string} source
   * @returns {string}
   */
  function stripSharedIndent(source) {
    const lines = source.split('\n');

    while (lines.length > 0 && WHITESPACE.test(lines[0])) {
      lines.shift();
    }
    while (lines.length > 0 && WHITESPACE.test(lines[lines.length - 1])) {
      lines.pop();
    }

    const minimumIndent = lines.reduce((indent, line) => {
      if (line.length === 0) {
        return indent;
      } else {
        return Math.min(getIndent(line), indent);
      }
    }, Infinity);

    return lines.map(line => line.slice(minimumIndent)).join('\n');
  }

  /**
   * Determines the indentation in number of spaces of a line.
   *
   * @param {string} line
   * @returns {number}
   */
  function getIndent(line) {
    let index = 0;
    while (line[index] === ' ') {
      index++;
    }
    return index;
  }
});
