import { deepEqual, throws } from 'assert';
import rangesOfComments from '../../src/utils/rangesOfComments';

describe.only('rangesOfComments', function() {
  it('returns nothing when there are no comments', function() {
    deepEqual(rangesOfComments('foo()'), []);
  });

  it('does not confuse string interpolation with comments', function() {
    deepEqual(rangesOfComments('a\n  b: "#{c}"\n  d: e'), []);
  });

  it('does not confuse regular expression with comments', function() {
    deepEqual(rangesOfComments('a = /#/'), []);
  });

  it('does not confuse division operator + regular expression with comments', function() {
    deepEqual(rangesOfComments('b = 2 / 5\na = /#/'), []);
    deepEqual(rangesOfComments('b /= 2\na = /#/'), []);
  });

  it('does not include the newline ending a line comment as part of the comment', function() {
    deepEqual(rangesOfComments('a # foo\n'), [{ start: 2, end: 7, type: 'line' }]);
  });

  it('correctly identifies escaped double quotes', function() {
    deepEqual(rangesOfComments('a\n  b: "\\"#{c}"\n  d: e # E!'), [{ start: 23, end: 27, type: 'line' }]);
  });

  it('does not confuse single-quoted string contents with comments', function() {
    deepEqual(rangesOfComments('a\n  b: \'#{c}\'\n  d: e'), []);
  });

  it('correctly identifies escaped single quotes', function() {
    deepEqual(rangesOfComments('a\n  b: \'\\\'#{c}\'\n  d: e # E!'), [{ start: 23, end: 27, type: 'line' }]);
  });

  it('identifies block comments', function() {
    deepEqual(rangesOfComments('###\n# a\n###'), [{ start: 0, end: 11, type: 'block' }]);
  });

  it('identifies indented block comments', function() {
    deepEqual(rangesOfComments('a\n  ###\n  # b\n  ###\n  c: d'), [{ start: 4, end: 19, type: 'block' }]);
  });

  it('identifies comments in string interpolations', function() {
    deepEqual(rangesOfComments('"""\n#{\n0 # zero\n}\n"""'), [{ start: 9, end: 15, type: 'line' }]);
  });

  it('identifies comments in nested string interpolations', function() {
    deepEqual(rangesOfComments('"""\n#{\n"#{\n1 # one\n}"\n"""'), [{ start: 13, end: 18, type: 'line' }]);
  });

  it('fails when there are too many closing braces', function() {
    throws(() => rangesOfComments('}'), /unexpected '}' found/);
  });

  it('fails when there are too many opening braces', function() {
    throws(() => rangesOfComments('{'), /unexpected EOF while looking for '}'/);
  });

  it('does not confuse braces within strings or regular expressions as significant', function() {
    deepEqual(rangesOfComments('{ "}": /}/ }'), []);
  });
});
