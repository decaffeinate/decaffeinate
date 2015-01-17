const assert = require('assert');

var convert;

before(function() {
  return require('../gobblefile').build({
    dest: '.tmp', force: true
  }).then(function() {
    convert = require('../.tmp').convert;
  }).catch(function(err) {
    console.error('Error building library:', err);
    throw err;
  });
});

describe('automatic conversions', function() {
  /**
   * @param {?string} name
   * @returns {ConvertOptions}
   */
  function onlyConvert(name) {
    const options = {
      commas: false,
      callParens: false,
      functionParens: false,
      this: false,
      objectBraces: false,
      prototypeAccess: false,
      declarations: false,
      returns: false,
      keywords: false
    };
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
    });

    describe('in function calls', function() {
      it('inserts commas after arguments if they are not there', function() {
        check('a(\n  1\n  2\n)', 'a(\n  1,\n  2\n)');
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

      it('inserts commas on the same line when the property value is an interpolated string', function() {
        check('a\n  b: "#{c}"\n  d: e', 'a\n  b: "#{c}",\n  d: e');
      });
    });
  });

  describe('inserting function call parentheses', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('callParens')), expected);
    }

    it('replaces the space between the callee and the first argument for first arg on same line', function() {
      check('a 1, 2\n',  'a(1, 2)\n');
    });

    it('does not add anything if there are already parens', function() {
      check('a()\n', 'a()\n');
      check('a(1, 2)\n', 'a(1, 2)\n');
    });

    it('adds parens for nested function calls', function() {
      check('a   b  c d     e\n', 'a(b(c(d(e))))\n');
    });

    it('adds parens for a new expression with args', function() {
      check('new Foo 1\n', 'new Foo(1)\n');
    });

    it('adds parens for a new expression without args', function() {
      check('new Foo\n', 'new Foo()\n');
    });

    it('adds parens after the properties of a member expression', function() {
      check('a.b c\n', 'a.b(c)\n');
    });

    it('adds parens after the brackets on a computed member expression', function() {
      check('a b[c]\n', 'a(b[c])\n');
    });

    it('adds parens without messing up multi-line calls', function() {
      check('a\n  b: c', 'a(\n  b: c\n)');
    });
  });

  describe('changing shorthand this to longhand this', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('this')), expected);
    }

    it('changes shorthand member expressions to longhand member expressions', function() {
      check('a = @a', 'a = this.a');
    });

    it('changes shorthand computed member expressions to longhand computed member expressions', function() {
      check('a = @[a]', 'a = this[a]');
    });

    it('changes shorthand standalone this to longhand standalone this', function() {
      check('bind(@)', 'bind(this)');
    });

    it('does not change longhand this', function() {
      check('this.a', 'this.a');
    });

    it('does not change "@" in strings', function() {
      check('"@"', '"@"');
    });

    it('does not add a dot to the shorthand prototype operator', function() {
      check('@::a', 'this::a');
    });

    it('does not double-expand nested member expressions', function() {
      check('@a.b', 'this.a.b');
    });

    it('does not double-expand nested computed member expressions', function() {
      check('@[a].b', 'this[a].b');
    });

    it('does not double-expand nested prototype access member expressions', function() {
      check('@::a.b', 'this::a.b');
    });
  });

  describe('changing prototype member access into normal member access', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('prototypeAccess')), expected);
    }

    it('replaces prototype member access', function() {
      check('A::b', 'A.prototype.b');
    });

    it('works in combination with the shorthand this patcher', function() {
      assert.strictEqual(convert('@::b'), 'this.prototype.b');
    });
  });

  describe('adding variable declarations', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('declarations')), expected);
    }

    it('adds variable declarations for assignments', function() {
      check('a = 1', 'var a = 1');
    });

    it('adds variable declarations for only the creating binding', function() {
      check('a = 1\na = 2', 'var a = 1\na = 2');
    });

    it('does not add variable declarations for reassignments in functions', function() {
      check('a = 1\n->\n  a = 2', 'var a = 1\n->\n  a = 2');
    });

    it('does not add variable declarations for reassignments of function params', function() {
      check('(a) -> a = 1', '(a) -> a = 1');
    });

    it('does not add variable declarations when the LHS is a member expression', function() {
      check('a.b = 1', 'a.b = 1');
    });
  });

  describe('adding explicit returns', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('returns')), expected);
    }

    it('adds a return for the only expression in functions', function() {
      check('a = -> 1', 'a = -> return 1');
    });

    it('does not add a return when one is already there', function() {
      check('a = -> return 1', 'a = -> return 1');
    });

    it('adds a return for the final expression in functions', function() {
      check('a = ->\n  1\n  2', 'a = ->\n  1\n  return 2');
    });
  });

  describe('changing keywords', function() {
    function check(source, expected) {
      assert.strictEqual(convert(source, onlyConvert('keywords')), expected);
    }

    it('renames "yes" to "true"', function() {
      check('a = yes', 'a = true');
    });

    it('renames "no" to "false"', function() {
      check('a = no', 'a = false');
    });

    it('renames "and" to "&&"', function() {
      check('a and b', 'a && b');
    });

    it('renames "or" to "||"', function() {
      check('a or b', 'a || b');
    });

    it('renames "not" to "!" and removes the space if one is present', function() {
      check('not a', '!a');
    });

    it('renames "not" to "!"', function() {
      check('not(a)', '!(a)');
    });

    it.skip('handles chained "not"s', function() {
      // This seems to trigger a CoffeeScriptRedux bug.
      // The inner LogicalNotOp has no raw/range.
      check('not not a', '!!a');
    });
  });
});
