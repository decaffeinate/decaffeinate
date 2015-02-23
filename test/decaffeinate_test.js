const assert = require('assert');
const withBuiltLibrary = require('./support/withBuiltLibrary');

var convert;

withBuiltLibrary('index', function(index) {
  convert = index.convert;
});

describe('automatic conversions', function() {
  function check(source, expected) {
    assert.strictEqual(convert(source), expected);
  }

  describe('inserting commas', function() {
    it('does not add commas after block comments', function() {
      check(
        '{\n  a: b\n  ###\n  # no comma\n  ###\n  c: d\n}',
        '({\n  a: b,\n  /**\n  * no comma\n   */\n  c: d\n});'
      );
    });

    describe('in arrays', function() {
      it('inserts commas at the end of lines that would have them in JavaScript', function() {
        check('[\n  1\n  2\n]', '[\n  1,\n  2\n];');
      });

      it('does not insert commas if there already is one', function() {
        check('[\n  1,\n  2\n]', '[\n  1,\n  2\n];');
      });

      it('does not insert commas in single-line arrays', function() {
        check('[ 1, 2 ]\n', '[ 1, 2 ];\n');
      });

      it('inserts commas only for objects that end a line', function() {
        check('[\n  1, 2\n  3\n  4\n]', '[\n  1, 2,\n  3,\n  4\n];');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('[\n  1 # hi!\n  2\n]', '[\n  1, // hi!\n  2\n];');
      });

      it('inserts commas in nested arrays', function() {
        check('[\n  [\n    1\n    2\n  ]\n  3\n]', '[\n  [\n    1,\n    2\n  ],\n  3\n];');
      });
    });

    describe('in objects', function() {
      it('inserts commas after properties if they are not there', function() {
        check('{\n  a: b\n  c: d\n}', '({\n  a: b,\n  c: d\n});');
      });

      it('does not insert commas if there already is one', function() {
        check('{\n  a: b,\n  c: d\n}', '({\n  a: b,\n  c: d\n});');
      });

      it('does not insert commas in single-line objects', function() {
        check('{ a: b, c: d }\n', '({ a: b, c: d });\n');
      });

      it('inserts commas only for objects that end a line', function() {
        check('{\n  a: b, c: d\n  e: f\n  g: h\n}', '({\n  a: b, c: d,\n  e: f,\n  g: h\n});');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('{\n  a: b # hi!\n  c: d\n}', '({\n  a: b, // hi!\n  c: d\n});');
      });

      it('inserts commas after shorthand properties', function() {
        check('{\n  a\n  c\n}', '({\n  a,\n  c\n});');
      });

      it('inserts commas for braceless objects', function() {
        check('a: b\nc: d', '({a: b,\nc: d});');
      });
    });

    describe('in function calls', function() {
      it('inserts commas after arguments if they are not there', function() {
        check('a(\n  1\n  2\n)', 'a(\n  1,\n  2\n);');
      });

      it('does not insert commas in single-line calls', function() {
        check('a(1, 2)', 'a(1, 2);');
      });

      it('inserts commas only for arguments that end a line', function() {
        check('a(\n  1, 2\n  3, 4)', 'a(\n  1, 2,\n  3, 4);');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('a(\n  1 # hi\n  2\n)', 'a(\n  1, // hi\n  2\n);');
      });

      it('inserts commas on the same line when the property value is an interpolated string', function() {
        check('a\n  b: "#{c}"\n  d: e', 'a({\n  b: `${c}`,\n  d: e\n});');
      });
    });
  });

  describe('inserting function call parentheses', function() {
    it('replaces the space between the callee and the first argument for first arg on same line', function() {
      check('a 1, 2\n',  'a(1, 2);\n');
    });

    it('does not add anything if there are already parens', function() {
      check('a()\n', 'a();\n');
      check('a(1, 2)\n', 'a(1, 2);\n');
    });

    it('adds parens for nested function calls', function() {
      check('a   b  c d     e\n', 'a(b(c(d(e))));\n');
    });

    it('adds parens for a new expression with args', function() {
      check('new Foo 1\n', 'new Foo(1);\n');
    });

    it('adds parens for a new expression without args', function() {
      check('new Foo\n', 'new Foo();\n');
    });

    it('adds parens after the properties of a member expression', function() {
      check('a.b c\n', 'a.b(c);\n');
    });

    it('adds parens after the brackets on a computed member expression', function() {
      check('a b[c]\n', 'a(b[c]);\n');
    });

    it('adds parens without messing up multi-line calls', function() {
      check('a\n  b: c', 'a({\n  b: c\n});');
    });

    it('adds parens to multi-line calls with the right indentation', function() {
      check('->\n  a\n    b: c', '(function() {\n  return a({\n    b: c\n  });\n});');
    });
  });

  describe('changing shorthand this to longhand this', function() {
    it('changes shorthand member expressions to longhand member expressions', function() {
      check('a = @a', 'var a = this.a;');
    });

    it('changes shorthand computed member expressions to longhand computed member expressions', function() {
      check('a = @[a]', 'var a = this[a];');
    });

    it('changes shorthand standalone this to longhand standalone this', function() {
      check('bind(@)', 'bind(this);');
    });

    it('does not change longhand this', function() {
      check('this.a', 'this.a;');
    });

    it('does not change "@" in strings', function() {
      check('"@"', '"@";');
    });

    it('does not add a dot to the shorthand prototype operator', function() {
      check('@::a', 'this.prototype.a;');
    });

    it('does not double-expand nested member expressions', function() {
      check('@a.b', 'this.a.b;');
    });

    it('does not double-expand nested computed member expressions', function() {
      check('@[a].b', 'this[a].b;');
    });

    it('does not double-expand nested prototype access member expressions', function() {
      check('@::a.b', 'this.prototype.a.b;');
    });
  });

  describe('changing prototype member access into normal member access', function() {
    it('replaces prototype member access', function() {
      check('A::b', 'A.prototype.b;');
    });

    it('works in combination with the shorthand this patcher', function() {
      check('@::b', 'this.prototype.b;');
    });
  });

  describe('adding variable declarations', function() {
    it('adds variable declarations for assignments', function() {
      check('a = 1', 'var a = 1;');
    });

    it('adds variable declarations for only the creating binding', function() {
      check('a = 1\na = 2', 'var a = 1;\na = 2;');
    });

    it('does not add variable declarations for reassignments in functions', function() {
      check('a = 1\n->\n  a = 2', 'var a = 1;\n(function() {\n  return a = 2;\n});');
    });

    it('does not add variable declarations for reassignments of function params', function() {
      check('(a) -> a = 1', '(function(a) { return a = 1; });');
    });

    it('does not add variable declarations when the LHS is a member expression', function() {
      check('a.b = 1', 'a.b = 1;');
    });

    it('adds variable declarations for destructuring array assignment', function() {
      check('[a] = b', 'var [a] = b;');
    });

    it('adds variable declarations for destructuring object assignment', function() {
      check('{a} = b', 'var {a} = b;');
    });

    it('does not add variable declarations for destructuring array assignment with previously declared bindings', function() {
      check('a = 1\n[a] = b', 'var a = 1;\n[a] = b;');
    });

    it('wraps object destructuring that is not part of a variable declaration in parentheses', function() {
      check('a = 1\n{a} = b', 'var a = 1;\n({a}) = b;');
    });

    it('adds variable declarations when the destructuring is mixed', function() {
      // FIXME: Is this a good idea? Should we be marking this as an error?
      check('a = 1\n[a, b] = c', 'var a = 1;\nvar [a, b] = c;');
    })
  });

  describe('adding explicit returns', function() {
    it('adds a return for the only expression in functions', function() {
      check('a = -> 1', 'var a = function() { return 1; };');
    });

    it('does not add a return when one is already there', function() {
      check('a = -> return 1', 'var a = function() { return 1; };');
    });

    it('adds a return for the final expression in functions', function() {
      check('a = ->\n  1\n  2', 'var a = function() {\n  1;\n  return 2;\n};');
    });
  });

  describe('changing keywords', function() {
    it('renames "yes" to "true"', function() {
      check('a = yes', 'var a = true;');
    });

    it('renames "no" to "false"', function() {
      check('a = no', 'var a = false;');
    });

    it('renames "and" to "&&"', function() {
      check('a and b', 'a && b;');
    });

    it('renames "or" to "||"', function() {
      check('a or b', 'a || b;');
    });

    it('renames "not" to "!" and removes the space if one is present', function() {
      check('not a', '!a;');
    });

    it('renames "not" to "!"', function() {
      check('not(a)', '!(a);');
    });

    it.skip('handles chained "not"s', function() {
      // This seems to trigger a CoffeeScriptRedux bug.
      // The inner LogicalNotOp has no raw/range.
      check('not not a', '!!a;');
    });
  });

  describe('changing string interpolation to template strings', function() {
    it('rewrites interpolations with #{} to ${}', function() {
      check('"a#{b}c"', '`a${b}c`;');
    });

    it('rewrites interpolations with spaces after the "{"', function() {
      check('"a#{ b }c"', '`a${ b }c`;');
    });
  });

  describe('adding semi-colons', function() {
    it('adds them after call expressions as statements', function() {
      check('a b', 'a(b);');
    });

    it('does not add them when they are already present', function() {
      check('a b; c d', 'a(b), c(d);');
    });

    it('does not add them when they are already present following whitespace', function() {
      check('a b ; c d', 'a(b) , c(d);');
    });

    it('adds them after identifiers as statements', function() {
      check('a', 'a;');
    });

    it('adds them after assignments', function() {
      check('a = 1', 'var a = 1;');
    });

    it('does not add them after `if` statements', function() {
      check('if a\n  b', 'if a\n  b;');
    });

    it('does not add them after `for` loops', function() {
      check('for a in b\n  a', 'for a in b\n  a;');
      check('for a of b\n  a', 'for a of b\n  a;');
    });

    it('does not add them after `while` loops', function() {
      check('while a\n  a', 'while a\n  a;');
    });

    it('does not add them after `loop` loops', function() {
      check('loop\n  a', 'loop\n  a;');
    });
  });

  describe('converting all at once', function() {
    it('adds semicolons after call parentheses', function() {
      check('Ember = require "ember"', 'var Ember = require("ember");');
    });

    it('adds braces to implicit object literals', function() {
      check('a b: c', 'a({b: c});');
    });

    it('adds parentheses around implicit bare object literals', function() {
      check('a: b', '({a: b});');
    });

    it('adds parentheses around explicit bare object literals', function() {
      check('{a}', '({a});');
    });

    it('adds object braces to the last function argument even if there are parentheses', function() {
      check('a(b: c)', 'a({b: c});');
    });

    it('does not add parentheses to objects that are implicit returns', function() {
      check('->\n  {a: b}', '(function() {\n  return {a: b};\n});');
    });

    it('leaves fat arrow functions as arrow functions', function() {
      check('add = (a, b) => a + b', 'var add = (a, b) => a + b;');
    });

    it('adds a block to fat arrow functions if their body is a block', function() {
      check('add = (a, b) =>\n  a + b', 'var add = (a, b) => {\n  return a + b;\n};');
    });

    it('turns `;`-separated sequences into `,`-separated sequences', function() {
      check('a; b', 'a, b;');
    });

    it('wraps the body of fat arrow functions if the body is a sequence', function() {
      check('=> a; b', '() => (a, b);');
    });

    it('handles functions without a body', function() {
      check('->', '(function() {});');
    });

    it('handles object literals with function property values', function() {
      check('a\n  b: ->\n    c\n\n  d: 1\n', 'a({\n  b: function() {\n    return c;\n  },\n\n  d: 1\n});\n');
    });

    it('handles object literals with function property values followed by comments', function() {
      check('a\n  b: ->\n    c\n\n# FOO\nd e', 'a({\n  b: function() {\n    return c;\n  }\n});\n\n// FOO\nd(e);');
    });

    it('converts line comments to // form', function() {
      check('# foo\n1', '// foo\n1;');
    });

    it('converts non-doc block comments to /* */', function() {
      check('a(\n  ###\n  HEY\n  ###\n  1\n)', 'a(\n  /*\n  HEY\n  */\n  1\n);');
    });

    it('converts doc block comments to /** */', function() {
      check('a(\n  ###\n  # HEY\n  ###\n  1\n)', 'a(\n  /**\n  * HEY\n   */\n  1\n);');
    });

    it('converts equality operator to triple-equal operator', function() {
      check('a == b', 'a === b;');
      check('a is b', 'a === b;');
    });

    it('converts negative equality operator to triple-not-equal operator', function() {
      check('a != b', 'a !== b;');
      check('a isnt b', 'a !== b;');
    });

    it('leaves less-than operators alone', function() {
      check('a < b', 'a < b;');
      check('a <= b', 'a <= b;');
    });

    it('leaves greater-than operators alone', function() {
      check('a > b', 'a > b;');
      check('a >= b', 'a >= b;');
    });

    it('leaves bitwise operators alone', function() {
      check('a & b', 'a & b;');
      check('a | b', 'a | b;');
      check('a ^ b', 'a ^ b;');
    });

    it('converts unary existential identifier checks to typeof + null check', function() {
      check('a?', 'typeof a !== "undefined" && a !== null;');
    });

    it('converts unary existential non-identifier to non-strict null check', function() {
      check('a.b?', 'a.b != null;');
      check('0?', '0 != null;');
    });

    it('surrounds unary existential operator results if needed', function() {
      check('a? or b?', '(typeof a !== "undefined" && a !== null) || (typeof b !== "undefined" && b !== null);');
      check('0? or 1?', '(0 != null) || (1 != null);');
    });

    it('converts named classes without bodies', function() {
      check('class A', 'class A {}');
    });

    it('converts anonymous classes without bodies wrapped in parentheses', function() {
      check('class', '(class {});');
    });

    it('preserves class body functions as method definitions', function() {
      check('class A\n  a: ->\n    1', 'class A {\n  a() {\n    return 1;\n  }\n}');
      check('->\n  class A\n    a: ->\n      1', '(function() {\n  return class A {\n    a() {\n      return 1;\n    }\n  };\n});');
    });

    it('preserves class constructors without arguments', function() {
      check('class A\n  constructor: ->\n    @a = 1', 'class A {\n  constructor() {\n    return this.a = 1;\n  }\n}');
    });

    it('preserves class constructors with arguments', function() {
      check('class A\n  constructor: (a) ->\n    @a = a', 'class A {\n  constructor(a) {\n    return this.a = a;\n  }\n}');
    });

    it('preserves `throw` when used in a statement context', function() {
      check('throw new Error()', 'throw new Error();');
    });

    it('wraps `throw` in an IIFE when used in an expression context', function() {
      check('doSomething() or (throw err)', 'doSomething() || (() => { throw err; })();');
    });

    it('passes `null` through as-is', function() {
      check('null', 'null;');
    });
  });
});
