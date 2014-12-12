const assert = require('assert');
const convert = require('..').convert;

describe('automatic conversions', function() {
  describe('inserting commas', function() {
    describe('in arrays', function() {
      it('inserts commas at the end of lines that would have them in JavaScript', function() {
        assert.strictEqual(convert('[\n  1\n  2\n]'), '[\n  1,\n  2\n]');
      });

      it('does not insert commas if there already is one', function() {
        assert.strictEqual(convert('[\n  1,\n  2\n]'), '[\n  1,\n  2\n]');
      });

      it('does not insert commas in single-line arrays', function() {
        assert.strictEqual(convert('[ 1, 2 ]\n'), '[ 1, 2 ]\n');
      });

      it('inserts commas only for objects that end a line', function() {
        assert.strictEqual(convert('[\n  1, 2\n  3\n  4\n]'), '[\n  1, 2,\n  3,\n  4\n]');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        assert.strictEqual(convert('[\n  1 # hi!\n  2\n]'), '[\n  1, # hi!\n  2\n]');
      });

      it('inserts commas in nested arrays', function() {
        assert.strictEqual(convert('[\n  [\n    1\n    2\n  ]\n  3\n]'), '[\n  [\n    1,\n    2\n  ],\n  3\n]');
      });
    });

    describe('in objects', function() {
      it('inserts commas after properties if they are not there', function() {
        assert.strictEqual(convert('{\n  a: b\n  c: d\n}'), '{\n  a: b,\n  c: d\n}');
      });

      it('does not insert commas if there already is one', function() {
        assert.strictEqual(convert('{\n  a: b,\n  c: d\n}'), '{\n  a: b,\n  c: d\n}');
      });

      it('does not insert commas in single-line objects', function() {
        assert.strictEqual(convert('{ a: b, c: d }\n'), '{ a: b, c: d }\n');
      });

      it('inserts commas only for objects that end a line', function() {
        assert.strictEqual(convert('{\n  a: b, c: d\n  e: f\n  g: h\n}'), '{\n  a: b, c: d,\n  e: f,\n  g: h\n}');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        assert.strictEqual(convert('{\n  a: b # hi!\n  c: d\n}'), '{\n  a: b, # hi!\n  c: d\n}');
      });

      it('inserts commas after shorthand properties', function() {
        assert.strictEqual(convert('{\n  a\n  c\n}'), '{\n  a,\n  c\n}');
      });

      it('inserts commas for braceless objects', function() {
        assert.strictEqual(convert('a: b\nc: d'), 'a: b,\nc: d');
      });

      it('inserts commas at the end of a multi-line property value', function() {
        assert.strictEqual(convert(
          '{\n  a: ->\n    1  \n\n  b: 2\n}'),
          '{\n  a: ->\n    1  \n  ,\n\n  b: 2\n}'
        );
      });
    });

    describe('in function calls', function() {
      it('inserts commas after arguments if they are not there', function() {
        assert.strictEqual(convert('a(\n  1\n  2\n)'), 'a(\n  1,\n  2\n)');
      });

      it('does not insert commas if there already is one', function() {
        assert.strictEqual(convert('a(\n  a,\n  c\n)'), 'a(\n  a,\n  c\n)');
      });

      it('does not insert commas in single-line calls', function() {
        assert.strictEqual(convert('a(1, 2)'), 'a(1, 2)');
      });

      it('inserts commas only for arguments that end a line', function() {
        assert.strictEqual(convert('a(\n  1, 2\n  3, 4)'), 'a(\n  1, 2,\n  3, 4)');
      });

      it('inserts commas immediately after the element if followed by a comment', function() {
        assert.strictEqual(convert('a(\n  1 # hi\n  2\n)'), 'a(\n  1, # hi\n  2\n)');
      });

      it('inserts commas at the end of a multi-line property value', function() {
        assert.strictEqual(convert(
          'a\n  b: ->\n    c\n\n  c: ->\n    d\n'),
          'a\n  b: ->\n    c\n  ,\n\n  c: ->\n    d\n'
        );
      });
    });
  });
});