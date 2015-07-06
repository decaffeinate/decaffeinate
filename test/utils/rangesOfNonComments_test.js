import { deepEqual } from 'assert';
import rangesOfNonComments from '../../src/utils/rangesOfNonComments';

describe('rangesOfNonComments', function() {
  it('returns nothing when there are no comments', function() {
    deepEqual(rangesOfNonComments('foo()'), [{ start: 0, end: 5 }]);
  });

  it('does not confuse string interpolation with comments', function() {
    deepEqual(rangesOfNonComments('a\n  b: "#{c}"\n  d: e'), [{ start: 0, end: 20 }]);
  });

  it('correctly identifies escaped double quotes', function() {
    deepEqual(rangesOfNonComments('a\n  b: "\\"#{c}"\n  d: e # E!'), [{ start: 0, end: 23 }]);
  });

  it('does not confuse single-quoted string contents with comments', function() {
    deepEqual(rangesOfNonComments('a\n  b: \'#{c}\'\n  d: e'), [{ start: 0, end: 20 }]);
  });

  it('correctly identifies escaped single quotes', function() {
    deepEqual(rangesOfNonComments('a\n  b: \'\\\'#{c}\'\n  d: e # E!'), [{ start: 0, end: 23 }]);
  });

  it('identifies block comments', function() {
    deepEqual(rangesOfNonComments('###\n# a\n###'), []);
  });

  it('identifies indented block comments', function() {
    deepEqual(rangesOfNonComments('a\n  ###\n  # b\n  ###\n  c: d'), [{ start: 0, end: 4 }, { start: 19, end: 26 }]);
  });
});
