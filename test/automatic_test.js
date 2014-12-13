const assert = require('assert');
const convert = require('..').convert;

describe('automatic conversions', function() {
  /**
   * @param {?string} name
   * @returns {{commas: boolean, callParens: boolean}}
   */
  function onlyConvert(name) {
    const options = { commas: false, callParens: false };
    if (name) { options[name] = true; }
    return options;
  }
  
  describe('inserting commas', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('commas')), expected);
    }

    it('can be opted out of with an option', function() {
      assert.strictEqual(convert('[\n  1\n  2\n]', onlyConvert(null)), '[\n  1\n  2\n]');
    });

    it('does not add commas after block comments', function() {
      check(
        '{\n  a: b\n  ###\n  # no comma\n  ###\n  c: d\n}',
        '{\n  a: b,\n  ###\n  # no comma\n  ###\n  c: d\n}'
      );
    });

    describe('in arrays', function() {
      it('inserts commas at the end of lines that would have them in JavaScript', function() {
        check('[\n  1\n  2\n]', '[\n  1,\n  2\n]');
      });

      it('does not insert commas if there already is one', function() {
        check('[\n  1,\n  2\n]', '[\n  1,\n  2\n]');
      });

      it('does not insert commas in single-line arrays', function() {
        check('[ 1, 2 ]\n', '[ 1, 2 ]\n');
      });

      it('inserts commas only for objects that end a line', function() {
        check('[\n  1, 2\n  3\n  4\n]', '[\n  1, 2,\n  3,\n  4\n]');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('[\n  1 # hi!\n  2\n]', '[\n  1, # hi!\n  2\n]');
      });

      it('inserts commas in nested arrays', function() {
        check('[\n  [\n    1\n    2\n  ]\n  3\n]', '[\n  [\n    1,\n    2\n  ],\n  3\n]');
      });
    });

    describe('in objects', function() {
      it('inserts commas after properties if they are not there', function() {
        check('{\n  a: b\n  c: d\n}', '{\n  a: b,\n  c: d\n}');
      });

      it('does not insert commas if there already is one', function() {
        check('{\n  a: b,\n  c: d\n}', '{\n  a: b,\n  c: d\n}');
      });

      it('does not insert commas in single-line objects', function() {
        check('{ a: b, c: d }\n', '{ a: b, c: d }\n');
      });

      it('inserts commas only for objects that end a line', function() {
        check('{\n  a: b, c: d\n  e: f\n  g: h\n}', '{\n  a: b, c: d,\n  e: f,\n  g: h\n}');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('{\n  a: b # hi!\n  c: d\n}', '{\n  a: b, # hi!\n  c: d\n}');
      });

      it('inserts commas after shorthand properties', function() {
        check('{\n  a\n  c\n}', '{\n  a,\n  c\n}');
      });

      it('inserts commas for braceless objects', function() {
        check('a: b\nc: d', 'a: b,\nc: d');
      });

      it('inserts commas at the end of a multi-line property value', function() {
        assert.strictEqual(convert(
          '{\n  a: ->\n    1  \n\n  b: 2\n}', onlyConvert('commas')),
          '{\n  a: ->\n    1  \n  ,\n\n  b: 2\n}'
        );
      });
    });

    describe('in function calls', function() {
      it('inserts commas after arguments if they are not there', function() {
        check('a(\n  1\n  2\n)', 'a(\n  1,\n  2\n)');
      });

      it('does not insert commas if there already is one', function() {
        check('a(\n  a,\n  c\n)', 'a(\n  a,\n  c\n)');
      });

      it('does not insert commas in single-line calls', function() {
        check('a(1, 2)', 'a(1, 2)');
      });

      it('inserts commas only for arguments that end a line', function() {
        check('a(\n  1, 2\n  3, 4)', 'a(\n  1, 2,\n  3, 4)');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        check('a(\n  1 # hi\n  2\n)', 'a(\n  1, # hi\n  2\n)');
      });

      it('inserts commas at the end of a multi-line property value', function() {
        check(
          'a\n  b: ->\n    c\n\n  c: ->\n    d\n',
          'a\n  b: ->\n    c\n  ,\n\n  c: ->\n    d\n'
        );
      });

      it('does not insert commas when there is one hiding on a line after the preceding argument', function() {
        check('a(\n  ->\n    b\n  ,\n  c\n)', 'a(\n  ->\n    b\n  ,\n  c\n)');
      });
    });
  });

  describe('inserting function call parentheses', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('callParens')), expected);
    }

    it('replaces the space between the callee and the first argument for first arg on same line', function() {
      check('a 1, 2',  'a(1, 2)');
    });

    it('does not add anything if there are already parens', function() {
      check('a()', 'a()');
      check('a(1, 2)', 'a(1, 2)');
    });

    it('adds parens for nested function calls', function() {
      check('a   b  c d     e', 'a(b(c(d(e))))');
    });

    it('adds parens for a new expression with args', function() {
      check('new Foo 1', 'new Foo(1)');
    });

    it('adds parens for a new expression without args', function() {
      check('new Foo', 'new Foo()');
    });

    it('adds parens wrapping loosely if the first arg is on a new line', function() {
      check('a\n  b: c\n', 'a(\n  b: c\n)\n');
    });

    it('adds parens wrapping tightly if the first arg is on the same line', function() {
      check('a (b) ->\n  c\n', 'a((b) ->\n  c)\n');
    });

    it('indents the loosely-wrapped parens if the call start is indented', function() {
      check('->\n  a\n    b: c\n', '->\n  a(\n    b: c\n  )\n');
    });

    it('adds parens for multi-line calls with multi-line arguments', function() {
      check('a\n  b: ->\n    c\n\n0', 'a(\n  b: ->\n    c\n)\n\n0');
    });

    it('adds parens for nested multi-line function calls', function() {
      check('a\n  b: c d, e\n  f:\n    g: h i\n', 'a(\n  b: c(d, e)\n  f:\n    g: h(i)\n)\n');
    });

    it('adds parens after the properties of a member expression', function() {
      check('a.b c', 'a.b(c)');
    });
  });
});